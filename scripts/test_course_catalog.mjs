#!/usr/bin/env node

import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';

import {
  join,
  resolve,
} from 'node:path';

import {
  tmpdir,
} from 'node:os';

import {
  spawnSync,
} from 'node:child_process';

import process from 'node:process';

const SCRIPT =
  resolve(
    process.cwd(),
    'scripts',
    'generate_course_catalog.mjs',
  );

let passed = 0;
let failed = 0;

function assert(
  condition,
  message,
) {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

async function createRoot() {
  return mkdtemp(
    join(
      tmpdir(),
      'course-catalog-test-',
    ),
  );
}

async function writeLab(
  root,
  number,
  {
    courseId =
      'terraform-aws-essentials',
    labId =
      `lab-${String(
        number,
      ).padStart(
        2,
        '0',
      )}`,
    tracking =
      true,
    title =
      `Práctica ${number}: Test`,
    duration =
      '20 minutos',
    labNumber =
      number,
  } = {},
) {
  const labDir =
    join(
      root,
      'labs',
      `lab${number}`,
    );

  await mkdir(
    labDir,
    {
      recursive:
        true,
    },
  );

  const source = `---
layout: lab
course_id: ${courseId}
lab_id: ${labId}
tracking: ${tracking}
title: "${title}"
permalink: /lab${number}/lab${number}/
duration: "${duration}"
lab_number: ${labNumber}
---

## Tarea 1. Test
{% assign tracking_task_id = "task-01" %}

- {% include step_label.html id="step-01" %} Test.
`;

  await writeFile(
    join(
      labDir,
      `lab${number}.md`,
    ),
    source,
    'utf8',
  );
}

async function writeManifest(
  root,
  courseId,
  labId,
) {
  const manifestDir =
    join(
      root,
      '.labcontrol',
      'manifests',
      courseId,
    );

  await mkdir(
    manifestDir,
    {
      recursive:
        true,
    },
  );

  await writeFile(
    join(
      manifestDir,
      `${labId}.json`,
    ),
    JSON.stringify(
      {
        version:
          1,
        hash:
          'sha256:' +
          'a'.repeat(
            64,
          ),
        tasks: [
          {
            taskId:
              'task-01',
            title:
              'Test',
            position:
              1,
            steps: [
              {
                stepId:
                  'step-01',
                position:
                  1,
              },
            ],
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
}

function runGenerator(
  root,
) {
  return spawnSync(
    process.execPath,
    [
      SCRIPT,
    ],
    {
      cwd:
        root,
      encoding:
        'utf8',
    },
  );
}

async function test(
  name,
  callback,
) {
  try {
    await callback();

    console.log(
      `✓ ${name}`,
    );

    passed += 1;
  } catch (
    error
  ) {
    console.error(
      `✗ ${name}`,
    );

    console.error(
      error instanceof Error
        ? error.message
        : String(
            error,
          ),
    );

    failed += 1;
  }
}

await test(
  'genera un catálogo con metadata y manifests de varios Labs',
  async () => {
    const root =
      await createRoot();

    try {
      await writeLab(
        root,
        1,
        {
          duration:
            '25 minutos',
        },
      );

      await writeLab(
        root,
        2,
        {
          duration:
            '35 minutos',
        },
      );

      await writeManifest(
        root,
        'terraform-aws-essentials',
        'lab-01',
      );

      await writeManifest(
        root,
        'terraform-aws-essentials',
        'lab-02',
      );

      const result =
        runGenerator(
          root,
        );

      assert(
        result.status ===
          0,
        result.stderr ||
          result.stdout,
      );

      const catalog =
        JSON.parse(
          await readFile(
            join(
              root,
              'labcontrol',
              'terraform-aws-essentials',
              'course.json',
            ),
            'utf8',
          ),
        );

      assert(
        catalog.version ===
          1,
        'Catalog version incorrecta.',
      );

      assert(
        catalog.courseId ===
          'terraform-aws-essentials',
        'courseId incorrecto.',
      );

      assert(
        catalog.labs.length ===
          2,
        'Se esperaban 2 Labs.',
      );

      assert(
        catalog.labs[0]
          .labId ===
          'lab-01',
        'El primer labId es incorrecto.',
      );

      assert(
        catalog.labs[0]
          .durationMinutes ===
          25,
        'La duración del Lab 1 es incorrecta.',
      );

      assert(
        catalog.labs[1]
          .durationMinutes ===
          35,
        'La duración del Lab 2 es incorrecta.',
      );

      assert(
        catalog.labs[0]
          .contentPath ===
          '/lab1/lab1/',
        'contentPath incorrecto.',
      );

      assert(
        catalog.labs[0]
          .manifest.tasks[0]
          .steps.length ===
          1,
        'El manifest no fue incorporado.',
      );
    } finally {
      await rm(
        root,
        {
          recursive:
            true,
          force:
            true,
        },
      );
    }
  },
);

await test(
  'ignora Labs sin tracking habilitado',
  async () => {
    const root =
      await createRoot();

    try {
      await writeLab(
        root,
        1,
      );

      await writeLab(
        root,
        2,
        {
          tracking:
            false,
        },
      );

      await writeManifest(
        root,
        'terraform-aws-essentials',
        'lab-01',
      );

      const result =
        runGenerator(
          root,
        );

      assert(
        result.status ===
          0,
        result.stderr ||
          result.stdout,
      );

      const catalog =
        JSON.parse(
          await readFile(
            join(
              root,
              'labcontrol',
              'terraform-aws-essentials',
              'course.json',
            ),
            'utf8',
          ),
        );

      assert(
        catalog.labs.length ===
          1,
        'El Lab sin tracking no fue ignorado.',
      );
    } finally {
      await rm(
        root,
        {
          recursive:
            true,
          force:
            true,
        },
      );
    }
  },
);

await test(
  'rechaza números de Lab duplicados dentro del mismo curso',
  async () => {
    const root =
      await createRoot();

    try {
      await writeLab(
        root,
        1,
        {
          labNumber:
            1,
        },
      );

      await writeLab(
        root,
        2,
        {
          labNumber:
            1,
        },
      );

      await writeManifest(
        root,
        'terraform-aws-essentials',
        'lab-01',
      );

      await writeManifest(
        root,
        'terraform-aws-essentials',
        'lab-02',
      );

      const result =
        runGenerator(
          root,
        );

      assert(
        result.status !==
          0,
        'El generador aceptó lab_number duplicado.',
      );

      assert(
        result.stderr.includes(
          'lab_number duplicado',
        ),
        'No reportó el error esperado.',
      );
    } finally {
      await rm(
        root,
        {
          recursive:
            true,
          force:
            true,
        },
      );
    }
  },
);

await test(
  'falla cuando falta el manifest oficial del Lab',
  async () => {
    const root =
      await createRoot();

    try {
      await writeLab(
        root,
        1,
      );

      const result =
        runGenerator(
          root,
        );

      assert(
        result.status !==
          0,
        'El generador aceptó un Lab sin manifest.',
      );

      assert(
        result.stderr.includes(
          'no existe un manifest generado',
        ),
        'No reportó el manifest faltante.',
      );
    } finally {
      await rm(
        root,
        {
          recursive:
            true,
          force:
            true,
        },
      );
    }
  },
);

console.log('');
console.log(
  `Tests: ${passed} passed, ${failed} failed`,
);

if (
  failed >
  0
) {
  process.exitCode =
    1;
}
