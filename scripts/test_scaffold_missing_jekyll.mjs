import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const TOOL = resolve('scripts/scaffold_missing_jekyll.mjs');
const ADOPT = resolve('scripts/adopt_course_complete.mjs');
const run = (bin,argv,cwd,ok=true) => {
  const p=spawnSync(bin,argv,{cwd,encoding:'utf8'});
  if(ok) assert.equal(p.status,0,p.stdout+'\n'+p.stderr);
  return p;
};
async function seed() {
  const root=await mkdtemp(join(tmpdir(),'missing-jekyll-'));
  await mkdir(join(root,'labs/lab1'),{recursive:true});
  const markdown=['---','title: "Práctica sin plantilla"','duration: "20 min"','---',
    '## Tarea 1',
    '- {% include step_label.html %} Primer paso académico.',
    '- {% include step_label.html %} Segundo paso académico.',''].join('\n');
  await writeFile(join(root,'labs/lab1/lab1.md'),markdown);
  run('git',['init','-b','main'],root);
  run('git',['remote','add','origin','https://github.com/Netec-Mx/Demo-Sin-Plantilla.git'],root);
  run('git',['add','.'],root);
  run('git',['-c','user.email=test@example.org','-c','user.name=Test','commit','-m','academic baseline'],root);
  return {root,markdown};
}
const args=(root,extra=[])=>[TOOL,'--target',root,'--tracking-id','demosinplantilla','--name','Demo sin plantilla',...extra];
test('scaffold dry-run no cambia archivos, apply crea solo faltantes',async()=>{
  const {root,markdown}=await seed();
  try{
    const before=(await readdir(root)).sort();
    run(process.execPath,args(root),root);
    assert.deepEqual((await readdir(root)).sort(),before);
    assert.equal(await readFile(join(root,'labs/lab1/lab1.md'),'utf8'),markdown);
    run(process.execPath,args(root,['--apply']),root);
    const config=await readFile(join(root,'_config.yml'),'utf8');
    assert.match(config,/baseurl: "\/Demo-Sin-Plantilla"/);
    assert.match(config,/url: "https:\/\/netec-mx.github.io"/);
    assert.match(await readFile(join(root,'_data/courses.yml'),'utf8'),/demosinplantilla:/);
    assert.ok((await stat(join(root,'Gemfile'))).isFile());
    const layout=await readFile(join(root,'_layouts/lab.html'),'utf8');
    assert.match(layout,/<article class="lab">/);
    assert.equal(await readFile(join(root,'labs/lab1/lab1.md'),'utf8'),markdown);
    await writeFile(join(root,'_layouts/default.html'),'CUSTOM NEVER REPLACE');
    run(process.execPath,args(root,['--apply']),root);
    assert.equal(await readFile(join(root,'_layouts/default.html'),'utf8'),'CUSTOM NEVER REPLACE');
  } finally {await rm(root,{recursive:true,force:true});}
});
test('adopter integra un curso con solo labs, sin copiar scripts ni JS',async()=>{
  const {root}=await seed();
  try{
    const command=[ADOPT,'--target',root,'--tracking-id','demosinplantilla','--code','DEMO_SIN_PLANTILLA','--name','Demo sin plantilla'];
    const dry=run(process.execPath,command,root);
    assert.match(dry.stdout,/DRY RUN/);
    assert.equal((await readdir(root)).includes('_config.yml'),false);
    const apply=run(process.execPath,[...command,'--apply'],root);
    assert.match(apply.stdout,/ADOPCIÓN MÍNIMA LISTA/);
    assert.ok((await stat(join(root,'_config.yml'))).isFile());
    assert.ok((await stat(join(root,'.github/workflows/pages.yml'))).isFile());
    assert.equal((await readdir(root)).includes('scripts'),false);
    assert.equal((await readdir(root)).includes('assets'),false);
    const course=JSON.parse(await readFile(join(root,'course.identity.json')));
    assert.equal(course.trackingId,'demosinplantilla');
    const md=await readFile(join(root,'labs/lab1/lab1.md'),'utf8');
    assert.match(md,/tracking_task_id = "t001"/);
    assert.match(md,/id="s001"/);
    assert.match(md,/Primer paso académico/);
    run(process.execPath,[resolve('scripts/generate_lab_manifest.mjs'),'--all'],root);
    run(process.execPath,[resolve('scripts/generate_course_catalog.mjs')],root);
    const catalog=JSON.parse(await readFile(join(root,'labcontrol/demosinplantilla/course.json'),'utf8'));
    assert.equal(catalog.labs.length,1);
    assert.equal(catalog.labs[0].manifest.tasks.length,1);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('incompatibilidad académica falla sin crear archivos',async()=>{
  const {root}=await seed();
  try{
    await writeFile(join(root,'labs/lab1/lab1.md'),'# Laboratorio sin pasos identificables');
    const before=(await readdir(root)).sort();
    const failure=run(process.execPath,args(root,['--apply']),root,false);
    assert.notEqual(failure.status,0);
    assert.match(failure.stderr,/frontmatter|step_label/);
    assert.deepEqual((await readdir(root)).sort(),before);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('Markdown sin frontmatter: añade metadata Jekyll y preserva instrucciones textuales',async()=>{
  const {root}=await seed();
  try{
    const bare=['# Laboratorio sin plantilla','',
      '## Tarea 1','- {% include step_label.html %} Ejecutar comando.', ''].join('\n');
    await writeFile(join(root,'labs/lab1/lab1.md'),bare);
    run('git',['add','.'],root);
    run('git',['-c','user.email=test@example.org','-c','user.name=Test','commit','-m','plain markdown'],root);
    const command=[ADOPT,'--target',root,'--tracking-id','demosinplantilla','--code','DEMO_SIN_PLANTILLA','--name','Demo sin plantilla'];
    run(process.execPath,[...command,'--apply'],root);
    const migrated=await readFile(join(root,'labs/lab1/lab1.md'),'utf8');
    assert.match(migrated,/^---\nlayout: lab\n/m);
    assert.match(migrated,/title: "Laboratorio sin plantilla"/);
    assert.match(migrated,/permalink: \/lab1\/lab1\//);
    assert.match(migrated,/# Laboratorio sin plantilla/);
    assert.match(migrated,/Ejecutar comando/);
    assert.match(migrated,/id="s001"/);
  }finally{await rm(root,{recursive:true,force:true});}
});
