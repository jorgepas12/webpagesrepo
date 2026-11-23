import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepare } from './prepare_course_build.mjs';

const layout = ['lab-demo-context.js','lab-progress.js','lab-tracker.js']
  .map(name => '<script src="{{ site.baseurl }}/assets/js/' + name + '"></script>').join('\n');
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'central-runtime-'));
  await mkdir(join(dir, '_layouts'), { recursive: true });
  await mkdir(join(dir, 'assets/js'), { recursive: true });
  await mkdir(join(dir, 'labs/lab1'), { recursive: true });
  await writeFile(join(dir, 'course.identity.json'), JSON.stringify({version:1, trackingId:'ckapriv'}));
  await writeFile(join(dir, '_config.yml'), 'baseurl: /CKA-Priv-\n');
  await writeFile(join(dir, '_layouts/default.html'), layout);
  await writeFile(join(dir, '_layouts/lab.html'), '<article class="lab">');
  await writeFile(join(dir, 'labs/lab1/lab1.md'), '# Original instructions\n');
  await writeFile(join(dir, 'assets/js/lab-progress.js'), '// legacy runtime\n');
  return dir;
}

test('check is read-only; apply installs complete context and shared JS; repeated apply is idempotent', async () => {
  const dir = await fixture();
  try {
    const lab = await readFile(join(dir,'labs/lab1/lab1.md'));
    const original = await readFile(join(dir,'assets/js/lab-progress.js'));
    const check = await prepare(['--target',dir,'--check']);
    assert.equal(check.applied,false);
    assert.equal(check.changed.length,6);
    assert.deepEqual(await readFile(join(dir,'assets/js/lab-progress.js')),original);
    assert.equal(await readFile(join(dir,'_layouts/default.html'),'utf8'),layout);
    const applied = await prepare(['--target',dir,'--apply']);
    assert.equal(applied.applied,true);
    assert.equal(applied.changed.length,6);
    assert.deepEqual((await prepare(['--target',dir,'--apply'])).changed,[]);
    assert.deepEqual(await readFile(join(dir,'labs/lab1/lab1.md')),lab);
    const updatedLayout = await readFile(join(dir,'_layouts/default.html'),'utf8');
    const loaders = ['lab-demo-context.js','lab-control-context-policy.js','lab-control-context.js','lab-progress.js','lab-tracker.js'];
    let last = -1;
    for (const loader of loaders) {
      const position = updatedLayout.indexOf('/assets/js/' + loader);
      assert.ok(position > last, 'Loader ausente o desordenado: ' + loader);
      last = position;
    }
    assert.equal((updatedLayout.match(/lab-control-context\.js/g) || []).length,1);
    assert.match(await readFile(join(dir,'assets/js/lab-control-context.js'),'utf8'),/LabControlContext/);
    assert.match(await readFile(join(dir,'assets/js/lab-control-context-policy.js'),'utf8'),/classifyContext/);
    assert.equal((await lstat(join(dir,'assets/js/lab-demo-context.js'))).isFile(),true);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('fail closed when runtime loader is missing, with no partial writes', async () => {
  const dir = await fixture();
  try {
    await writeFile(join(dir,'_layouts/default.html'),layout.replace('lab-tracker.js','missing.js'));
    await assert.rejects(prepare(['--target',dir,'--apply']),/Loader técnico ausente/);
    assert.equal(await readFile(join(dir,'assets/js/lab-progress.js'),'utf8'),'// legacy runtime\n');
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('fail closed on symlink and do not modify content', async (t) => {
  const dir = await fixture();
  try {
    await rm(join(dir,'assets/js/lab-progress.js'));
    const { symlink } = await import('node:fs/promises');
    try {
      await symlink(join(dir,'labs/lab1/lab1.md'),join(dir,'assets/js/lab-progress.js'));
    } catch (error) {
      // Standard Windows users may not have permission to create symlinks.
      // Linux CI still executes this security assertion in full.
      if (process.platform === 'win32' && ['EPERM','EACCES'].includes(error.code)) {
        t.skip('Windows no permite crear symlinks; se verifica en GitHub Actions Linux');
        return;
      }
      throw error;
    }
    await assert.rejects(prepare(['--target',dir,'--apply']),/Ruta insegura/);
    assert.equal(await readFile(join(dir,'labs/lab1/lab1.md'),'utf8'),'# Original instructions\n');
  } finally { await rm(dir,{recursive:true,force:true}); }
});
