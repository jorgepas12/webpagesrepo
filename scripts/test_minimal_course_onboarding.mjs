import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const SCRIPT = resolve('scripts/adopt_course_complete.mjs');
function run(bin, argv, cwd) {
  const result = spawnSync(bin, argv, {cwd, encoding:'utf8', env:process.env});
  assert.equal(result.status,0, [bin,argv.join(' '),result.stdout,result.stderr].join('\n'));
  return result.stdout;
}

test('nuevo curso Jekyll independiente: incorporación mínima, tracking estable y sin scripts locales', async () => {
  const root = await mkdtemp(join(tmpdir(), 'course-minimal-onboarding-'));
  try {
    for (const path of ['labs/lab1','_layouts','_data']) await mkdir(join(root,path),{recursive:true});
    await writeFile(join(root, '_config.yml'), 'title: Curso Demo\nurl: "https://netec-mx.github.io"\nbaseurl: "/CursoDemo"\n');
    await writeFile(join(root,'_layouts/default.html'), '<!doctype html><html><body>{{ content }}</body></html>');
    await writeFile(join(root,'_layouts/lab.html'), '---\nlayout: default\n---\n<article class="lab">{{ content }}</article>');
    await writeFile(join(root,'_data/courses.yml'), 'democurso:\n  title: "Curso Demo"\n  labs:\n    - id: lab1\n      title: "Práctica 1"\n      url: "/lab1/lab1/"\n      duration: "20 min"\n');
    const academic = [
      '---','layout: lab','title: "Práctica 1: prueba"','permalink: /lab1/lab1/','duration: "20 minutos"','---','',
      '## Tarea 1. Preparación','- {% include step_label.html %} Instalar herramientas.','',
      '## Tarea 2. Validación','- {% include step_label.html %} Validar resultado.',''
    ].join('\n');
    await writeFile(join(root,'labs/lab1/lab1.md'),academic);
    run('git',['init','-b','main'],root);
    run('git',['remote','add','origin','https://github.com/Netec-Mx/Demo-Curso.git'],root);
    run('git',['add','.'],root);
    run('git',['-c','user.name=CI','-c','user.email=ci@example.test','commit','-m','baseline'],root);
    const args=[SCRIPT,'--target',root,'--tracking-id','democurso','--code','DEMO_CURSO','--name','Curso Demo'];
    run(process.execPath,args,root);
    assert.deepEqual(await readdir(join(root,'_includes')).catch(()=>[]),[]);
    assert.equal(await readFile(join(root,'labs/lab1/lab1.md'),'utf8'),academic);
    run(process.execPath,[...args,'--apply'],root);
    const files=await readdir(root);
    assert.ok(files.includes('course.identity.json'));
    assert.equal(files.includes('labcontrol'),false,'El catálogo se genera únicamente en CI');
    assert.equal(files.includes('.labcontrol'),false,'Los manifests se generan únicamente en CI');
    assert.equal(files.includes('scripts'),false,'No se deben copiar scripts locales');
    assert.equal((await readdir(join(root,'assets/js')).catch(()=>[])).length,0,'JS lo prepara Actions');
    assert.ok((await readFile(join(root,'_layouts/default.html'),'utf8')).includes('lab-tracker.js'));
    assert.ok((await readFile(join(root,'.github/workflows/pages.yml'),'utf8')).includes('prepare_course_build.mjs'));
    const markdown=await readFile(join(root,'labs/lab1/lab1.md'),'utf8');
    assert.match(markdown,/course_id: democurso/);
    assert.match(markdown,/tracking_task_id = "t002"/);
    assert.match(markdown,/id="s002"/);
    assert.match(markdown,/Instalar herramientas/);
    assert.match(markdown,/Validar resultado/);
    // Emulate the temporary GitHub Actions checkout: central tools generate artifacts.
    run(process.execPath,[resolve('scripts/generate_lab_manifest.mjs'),'--all'],root);
    run(process.execPath,[resolve('scripts/generate_course_catalog.mjs')],root);
    const catalog=JSON.parse(await readFile(join(root,'labcontrol/democurso/course.json'),'utf8'));
    assert.equal(catalog.labs.length,1);
    assert.equal(catalog.labs[0].manifest.tasks.length,2);
    assert.equal(catalog.labs[0].manifest.tasks.flatMap(t=>t.steps).length,2);
    // The builder consumes central scripts and JS without persisting them in course Git.
    const tooling=resolve('scripts/prepare_course_build.mjs');
    run(process.execPath,[tooling,'--target',root,'--apply'],root);
    assert.equal((await stat(join(root,'assets/js/lab-progress.js'))).isFile(),true);
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});
