#!/usr/bin/env node
/**
 * Inicializa UNA COPIA NUEVA de la plantilla webpagesrepo.
 * No usar en repositorios de cursos ya publicados.
 * Uso: node scripts/init_course.mjs --repo OWNER/REPO --id course-id
 *      --title "Nombre" --labs 13 [--intro "Descripción"] [--force-template]
 */
import { readFile, writeFile, readdir, rm, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const root = process.cwd();
const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i += 2) {
  if (!args[i].startsWith('--') || !args[i + 1]) {
    throw new Error('Argumentos: --repo OWNER/REPO --id course-id --title NOMBRE --labs N [--intro TEXTO]');
  }
  opt[args[i].slice(2)] = args[i + 1];
}
const { repo, id, title, intro = '', labs } = opt;
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo ?? '')) throw new Error('--repo debe ser OWNER/REPO.');
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id ?? '')) throw new Error('--id debe ser kebab-case.');
if (!title?.trim() || /[\r\n]/.test(title)) throw new Error('--title requerido en una sola línea.');
if (!/^[1-9]\d*$/.test(labs ?? '') || Number(labs) > 999) throw new Error('--labs debe estar entre 1 y 999.');
if (/[\r\n]/.test(intro)) throw new Error('--intro debe estar en una sola línea.');

const gitRemote = (() => {
  try { return execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim(); }
  catch { return ''; }
})();
if (/jorgepas12\/webpagesrepo(?:\.git)?$/i.test(gitRemote)) {
  throw new Error('No inicialices el repositorio maestro. Crea un repo desde la plantilla primero.');
}
const existing = await readdir(resolve(root, 'labs'), { withFileTypes: true });
const realLabDirs = existing.filter(x => x.isDirectory() && /^lab\d+$/.test(x.name));
if (realLabDirs.some(x => x.name !== 'lab1')) {
  throw new Error('Se detectaron labs existentes. No se modificará un curso iniciado.');
}
const sampleFile = resolve(root, 'labs/lab1/lab1.md');
const sample = await readFile(sampleFile, 'utf8').catch(() => '');
if (!sample.includes('CAMBIAR_AQUI_NOMBRE_DE_LA_PRACTICA')) {
  throw new Error('lab1 no es la plantilla de ejemplo. Se cancela para preservar contenido.');
}
const identities = await readFile(resolve(root, '_data/labcontrol-identities.yml'), 'utf8').catch(() => '');
if (identities && !identities.includes('terraform-aws-essentials:')) {
  throw new Error('El registro de IDs no es el registro original de la plantilla.');
}
const yaml = value => JSON.stringify(value);
const repoName = repo.split('/')[1];
const url = 'https://' + repo.split('/')[0].toLowerCase() + '.github.io';
const configPath = resolve(root, '_config.yml');
let config = await readFile(configPath, 'utf8');
if (!config.includes('/NOMBRE_DEL_REPO')) throw new Error('_config.yml ya fue personalizado.');
config = config.replace('url: "https://netec-mx.github.io"', 'url: ' + yaml(url));
config = config.replace('baseurl: "/NOMBRE_DEL_REPO"', 'baseurl: ' + yaml('/' + repoName));
config = config.replace('repository: netec-mx/NOMBRE_DEL_REPO', 'repository: ' + repo);
const catalog = [
  '# _data/courses.yml',
  id + ':',
  '  title: ' + yaml(title),
  '  intro: ' + yaml(intro || title),
  '  labs:'
];
for (let n = 1; n <= Number(labs); n++) {
  catalog.push('    - id: lab' + n,
    '      title: ' + yaml('Práctica ' + n + ': editar título'),
    '      url: ' + yaml('/lab' + n + '/lab' + n + '/'),
    '      duration: "0 min"',
    '      desc: "Completar descripción de la práctica."');
}
// Preparación completa validada antes de modificar archivos.
await writeFile(configPath, config);
await writeFile(resolve(root, '_data/courses.yml'), catalog.join('\n') + '\n');
await writeFile(resolve(root, '_data/labcontrol-identities.yml'),
  '# Registro persistente de identidades LabControl. No reutilizar IDs.\n');
await writeFile(resolve(root, 'README.md'),
  '# ' + title + '\n\nPublicación: ' + url + '/' + repoName + '/\n\nTracking ID: ' + id + '\n');
await rm(sampleFile);
await mkdir(resolve(root, 'labs/lab1'), { recursive: true });
execFileSync('bash', ['scripts/create_labs.sh', labs, id, '--dry-run'], { cwd: root, stdio: 'inherit' });
console.log('Inicialización terminada. Edita _data/courses.yml, _data/task-results.yml y labs/labN/labN.md antes de publicar.');
