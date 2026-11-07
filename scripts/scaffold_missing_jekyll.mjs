#!/usr/bin/env node
/**
 * Bootstrap missing Jekyll infrastructure for a pre-existing course.
 * Never overwrites existing files, lab Markdown, or tracking IDs.
 * dry-run by default, --apply writes only missing technical files.
 */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const args=process.argv.slice(2);
const val=flag=>{const i=args.indexOf(flag);return i<0?null:args[i+1];};
const target=resolve(val('--target')||'.');
const trackingId=val('--tracking-id');
const name=val('--name');
const description=val('--description')||'';
const apply=args.includes('--apply');
const expected=['--target','--tracking-id','--name','--description','--apply'];
for(let i=0;i<args.length;i++){if(!expected.includes(args[i]))throw Error('Opción no reconocida: '+args[i]);if(args[i]!=='--apply')i++;}
if(!/^[a-z0-9]{2,20}$/.test(trackingId||''))throw Error('tracking-id inválido');
if(!name||name.length>200)throw Error('Nombre del curso obligatorio y máximo 200 caracteres');
const exists=async p=>stat(join(target,p)).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;});
const git=spawnSync('git',['remote','get-url','origin'],{cwd:target,encoding:'utf8'});
if(git.status!==0)throw Error('Se necesita remote origin para calcular URL de GitHub Pages; configurar origin antes');
const match=git.stdout.trim().match(/(?:github\.com[:/])([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i);
if(!match)throw Error('origin no es GitHub owner/repo; no se puede definir URL pública con seguridad');
const owner=match[1],repo=match[2],baseurl='/'+repo,siteUrl='https://'+owner.toLowerCase()+'.github.io';
if(!await exists('.git'))throw Error('Debe existir repositorio Git');
if(!await exists('labs'))throw Error('Debe existir carpeta labs con prácticas identificables');

const { readdir }=await import('node:fs/promises');
const labFolders=(await readdir(join(target,'labs'),{withFileTypes:true})).filter(e=>e.isDirectory()&&/^lab[1-9]\d*$/.test(e.name)).map(e=>Number(e.name.slice(3))).sort((a,b)=>a-b);
if(!labFolders.length||labFolders.some((n,i)=>n!==i+1))throw Error('Se requiere secuencia labs/lab1..labN antes de incorporar');
const labs=[];
for(const n of labFolders){
  const rel=`labs/lab${n}/lab${n}.md`;
  if(!await exists(rel))throw Error('Práctica ausente: '+rel);
  const markdown=await readFile(join(target,rel),'utf8');
  if(!/{%\s*include\s+step_label\.html\b/.test(markdown))throw Error('No se encontraron step_label en '+rel+'; requiere revisión didáctica antes de asignar IDs');
  const title=markdown.match(/^title:\s*(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g,'') || markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || `Práctica ${n}`;
  const duration=markdown.match(/^duration:\s*(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g,'') || '0 min';
  labs.push({n,title,duration});
}
const config=[
  'title: '+JSON.stringify(name),
  'description: '+JSON.stringify(description),
  'url: '+JSON.stringify(siteUrl),
  'baseurl: '+JSON.stringify(baseurl),
  'repository: '+JSON.stringify(owner+'/'+repo),
  'include:',
  '  - .well-known',
  'exclude:',
  '  - .github',
  '  - scripts/',
  '  - Gemfile',
  '  - Gemfile.lock',
  '  - README.md',
  'labcontrol_api_url: "https://labcontrol.superwebapp.com/api"',
  ''
].join('\n');
const courses=[
  trackingId+':',
  '  title: '+JSON.stringify(name),
  '  intro: '+JSON.stringify(description),
  '  labs:',
  ...labs.flatMap(({n,title,duration})=>[
    '    - id: lab'+n,
    '      title: '+JSON.stringify(title),
    '      url: '+JSON.stringify(`/lab${n}/lab${n}/`),
    '      duration: '+JSON.stringify(duration),
    '      desc: '+JSON.stringify(title)
  ]),
  ''
].join('\n');
const files={
  '_config.yml':config,
  '_data/courses.yml':courses,
  '_layouts/default.html':`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ page.title | default: site.title }}</title></head>
<body><main>{{ content }}</main></body></html>
`,
  '_layouts/lab.html':`---
layout: default
---
<article class="lab">{{ content }}</article>
`,
  'Gemfile':`source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
gem "webrick", "~> 1.8"
`,
  'index.md':`---
layout: default
title: ${JSON.stringify(name)}
---
# {{ site.title }}
{% for lab in site.data.courses.${trackingId}.labs %}
- [{{ lab.title }}]({{ lab.url | relative_url }})
{% endfor %}
`
};
// Course templates normally use curso/<trackingId>.md with permalink: /.
// Jekyll must not have a second root page generated as index.md.
async function hasExistingRootPage() {
  if (await exists('index.html') || await exists('index.markdown') || await exists('index.md')) return true;
  const courseDir = join(target, 'curso');
  let entries;
  try { entries = await readdir(courseDir, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  for (const entry of entries) {
    if (!entry.isFile() || !/\\.(md|markdown|html)$/i.test(entry.name)) continue;
    const body = await readFile(join(courseDir, entry.name), 'utf8');
    const frontmatter = body.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---(?:\\r?\\n|$)/)?.[1] ?? '';
    if (/^permalink:\\s*['"]?\\/['"]?\\s*(?:#.*)?$/m.test(frontmatter)) return true;
  }
  return false;
}
const hasRootPage = await hasExistingRootPage();
const missing=[];
for(const [path,content] of Object.entries(files)){
  if(path==='index.md' && hasRootPage)continue;
  if(!await exists(path))missing.push({path,content});
}
console.log('Curso:',owner+'/'+repo,'| Labs:',labs.length,'| Modo:',apply?'APPLY':'DRY RUN');
for(const f of missing)console.log('Crear (no existe):',f.path);
if(!missing.length)console.log('No faltan archivos base Jekyll; no se sobrescribe nada.');
if(!apply){
 console.log('Simulación completa; no se modificaron archivos.');
}else{
 for(const f of missing){await mkdir(dirname(join(target,f.path)),{recursive:true});await writeFile(join(target,f.path),f.content,{flag:'wx'});}
 console.log('Estructura técnica faltante creada. Revisar diff y continuar integración.');
}
