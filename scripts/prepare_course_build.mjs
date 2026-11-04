#!/usr/bin/env node
/**
 * Prepare a tracked Jekyll course in an ephemeral CI checkout.
 * Source of shared runtime: this webpagesrepo checkout (not course scripts).
 * Does not touch lab Markdown, tracking identity, layouts or course configuration.
 *
 * Modes: --check (default, reports differences) and --apply (CI copy).
 * Instructors must never run this against their working repository.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLING = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME_FILES = Object.freeze([
  'assets/js/lab-demo-context.js',
  'assets/js/lab-progress.js',
  'assets/js/lab-tracker.js',
]);

async function regular(path, optional = false) {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw Error('Ruta insegura/no regular: ' + path);
    }
    return true;
  } catch (error) {
    if (optional && error.code === 'ENOENT') return false;
    throw error;
  }
}

const digest = data => createHash('sha256').update(data).digest('hex');
function parseArgs(args) {
  let target;
  let apply = false;
  let help = false;
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target':
        if (target || !args[i + 1] || args[i + 1].startsWith('--')) throw Error('--target requiere una ruta única');
        target = args[++i];
        break;
      case '--apply':
        if (apply) throw Error('--apply duplicado');
        apply = true;
        break;
      case '--check':
        break;
      case '--help':
        help = true;
        break;
      default:
        throw Error('Argumento desconocido: ' + args[i]);
    }
  }
  if (help) return { help: true };
  if (!target) throw Error('Requiere --target /ruta/checkout-efimero');
  return { target: resolve(target), apply };
}

export async function prepare(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) {
    console.log('Uso: node scripts/prepare_course_build.mjs --target /ruta/checkout-efimero [--check|--apply]');
    return { changed: [], applied: false };
  }
  const { target, apply } = options;
  if (target === TOOLING || !relative(TOOLING, target)) {
    throw Error('No preparar la plantilla central sobre sí misma');
  }
  // Mandatory inputs are validated before any writes.
  for (const path of ['course.identity.json', '_config.yml', '_layouts/default.html', '_layouts/lab.html']) {
    await regular(join(target, path));
  }
  const identity = JSON.parse(await readFile(join(target, 'course.identity.json'), 'utf8'));
  if (identity.version !== 1 || !/^[a-z0-9]{2,20}$/.test(identity.trackingId ?? '')) {
    throw Error('Identidad de curso inválida');
  }
  const defaultLayout = await readFile(join(target, '_layouts/default.html'), 'utf8');
  const expected = RUNTIME_FILES.map(path => path.split('/').at(-1));
  let previous = -1;
  for (const basename of expected) {
    const position = defaultLayout.indexOf('/assets/js/' + basename);
    if (position < 0 || position < previous) {
      throw Error('Loader técnico ausente o fuera de orden: ' + basename);
    }
    previous = position;
  }

  const changes = [];
  // Prepare all inputs before mutation, and guard symlinks in destinations.
  for (const rel of RUNTIME_FILES) {
    const source = join(TOOLING, rel);
    const dest = join(target, rel);
    await regular(source);
    const exists = await regular(dest, true);
    const desired = await readFile(source);
    const current = exists ? await readFile(dest) : null;
    if (!current || !desired.equals(current)) {
      changes.push({ rel, dest, desired, before: current && digest(current), after: digest(desired) });
    }
  }
  console.log('Curso:', identity.trackingId, '|', apply ? 'APPLY (solo checkout temporal)' : 'CHECK');
  for (const c of changes) console.log(c.before ? 'Actualizar:' : 'Agregar:', c.rel, c.after);
  if (apply) {
    for (const c of changes) {
      await mkdir(dirname(c.dest), { recursive: true });
      await writeFile(c.dest, c.desired);
    }
  }
  console.log(changes.length ? `Archivos técnicos diferentes: ${changes.length}` : 'Runtime técnico sin diferencias');
  console.log('Contenido académico, IDs y configuración del curso: no modificados');
  return { changed: changes.map(x => x.rel), applied: apply };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepare().catch(error => {
    console.error('ERROR:', error.message);
    process.exitCode = 1;
  });
}
