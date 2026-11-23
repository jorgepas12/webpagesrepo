import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run, prepareLayout } from './update_existing_course_runtime.mjs';

const baseLayout = `<!doctype html>
<script src="{{ site.baseurl }}/assets/js/lab-progress.js"></script>
<script src="{{ site.baseurl }}/assets/js/lab-tracker.js"></script>`;

function assertRuntimeOrder(html) {
  let previous = -1;
  for (const name of [
    'lab-demo-context.js', 'lab-control-context-policy.js',
    'lab-control-context.js', 'lab-progress.js'
  ]) {
    const position = html.indexOf('/assets/js/' + name);
    assert.ok(position > previous, 'Orden incorrecto: ' + name);
    previous = position;
  }
}

test('layout carga demo primero, es idempotente', () => {
  const updated = prepareLayout(baseLayout);
  assertRuntimeOrder(updated);
  assert.ok(!updated.includes('\\n  <script'), 'No escribir un salto de línea literal en HTML');
  assert.ok(updated.includes('</script>\n  <script'), 'Separar scripts con salto real');
  assert.equal(prepareLayout(updated), updated);
  const empty = prepareLayout('<html><body><p>sin seguimiento</p></body></html>');
  assert.match(empty, /lab-demo-context\.js[\s\S]*lab-progress\.js/);
  assert.equal(prepareLayout(empty), empty);
  assert.throws(() => prepareLayout('<p>sin seguimiento</p>'), /cierre/);
});

test('curso existente: dry-run no toca labs; apply guarda respaldo; repetir es idempotente', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'webpages-course-runtime-'));
  try {
    await mkdir(join(dir, 'labs', 'lab1'), { recursive: true });
    await mkdir(join(dir, '_layouts'), { recursive: true });
    await mkdir(join(dir, 'assets', 'js'), { recursive: true });
    await writeFile(join(dir, 'labs/lab1/lab1.md'), '# Instrucciones existentes\n');
    await writeFile(join(dir, '_layouts/default.html'), baseLayout);
    await writeFile(join(dir, 'assets/js/lab-progress.js'), '/* OLD */');
    await writeFile(join(dir, 'assets/js/lab-tracker.js'), '/* OLD */');
    const original = await readFile(join(dir, 'labs/lab1/lab1.md'), 'utf8');
    await run(['--target', dir]);
    assert.equal(await readFile(join(dir, 'assets/js/lab-progress.js'), 'utf8'), '/* OLD */');
    await run(['--target', dir, '--apply']);
    const html = await readFile(join(dir, '_layouts/default.html'), 'utf8');
    assertRuntimeOrder(html);
    assert.notEqual(await readFile(join(dir, 'assets/js/lab-progress.js'), 'utf8'), '/* OLD */');
    assert.match(await readFile(join(dir, 'assets/js/lab-control-context.js'), 'utf8'), /LabControlContext/);
    assert.match(await readFile(join(dir, 'assets/js/lab-control-context-policy.js'), 'utf8'), /classifyContext/);
    assert.equal(await readFile(join(dir, 'labs/lab1/lab1.md'), 'utf8'), original);
    const folders = await readdir(join(dir, '.labcontrol-template-backup'));
    assert.equal(folders.length, 1);
    assert.equal(await readFile(join(dir, '.labcontrol-template-backup', folders[0], 'assets/js/lab-progress.js'), 'utf8'), '/* OLD */');
    await run(['--target', dir, '--apply']);
    assert.equal((await readdir(join(dir, '.labcontrol-template-backup'))).length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
