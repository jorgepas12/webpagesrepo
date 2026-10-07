#!/usr/bin/env node

import {
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';

import {
  basename,
  dirname,
  join,
  resolve,
} from 'node:path';

import process from 'node:process';

const CATALOG_VERSION = 1;

const COURSE_ID_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const LAB_ID_PATTERN =
  /^l\d{3}$/;

const FRONT_MATTER_PATTERN =
  /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;

function fail(message) {
  console.error(
    `Error: ${message}`,
  );

  process.exitCode = 1;
}

function normalizeLineEndings(value) {
  return value.replace(
    /\r\n/g,
    '\n',
  );
}

function parseSimpleFrontMatter(source) {
  const match =
    source.match(
      FRONT_MATTER_PATTERN,
    );

  if (!match) {
    throw new Error(
      'No se encontró front matter YAML válido.',
    );
  }

  const values = {};

  for (
    const line of normalizeLineEndings(
      match[1],
    ).split('\n')
  ) {
    const simple =
      line.match(
        /^([a-zA-Z0-9_-]+):\s*(.*?)\s*$/,
      );

    if (!simple) {
      continue;
    }

    let value =
      simple[2].trim();

    if (
      (
        value.startsWith('"') &&
        value.endsWith('"')
      ) ||
      (
        value.startsWith("'") &&
        value.endsWith("'")
      )
    ) {
      value =
        value.slice(
          1,
          -1,
        );
    }

    values[
      simple[1]
    ] = value;
  }

  return values;
}

function parseBoolean(value) {
  return (
    String(value).toLowerCase() ===
    'true'
  );
}

function validateTrackingId(
  value,
  label,
) {
  const pattern =
    label === 'lab_id'
      ? LAB_ID_PATTERN
      : COURSE_ID_PATTERN;

  if (
    !value ||
    !pattern.test(
      value,
    )
  ) {
    const expected =
      label === 'lab_id'
        ? 'lNNN, por ejemplo l001'
        : 'kebab-case';

    throw new Error(
      `${label} inválido: "${value ?? ''}". Formato esperado: ${expected}.`,
    );
  }
}

function parseInteger(
  value,
  label,
) {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    throw new Error(
      `${label} debe ser un entero mayor que 0.`,
    );
  }

  return parsed;
}

function parseDurationMinutes(value) {
  if (!value) {
    return null;
  }

  const match =
    String(value).match(
      /(\d+)/,
    );

  if (!match) {
    return null;
  }

  const minutes =
    Number(match[1]);

  return Number.isInteger(minutes) &&
    minutes > 0
    ? minutes
    : null;
}

async function findLabFiles(
  labsDir,
) {
  const entries =
    await readdir(
      labsDir,
      {
        withFileTypes:
          true,
      },
    );

  const files = [];

  for (
    const entry
    of entries
  ) {
    if (
      !entry.isDirectory() ||
      !/^lab\d+$/.test(
        entry.name,
      )
    ) {
      continue;
    }

    const labFile =
      join(
        labsDir,
        entry.name,
        `${entry.name}.md`,
      );

    try {
      await readFile(
        labFile,
        'utf8',
      );

      files.push(
        labFile,
      );
    } catch {
      // Ignora carpetas sin labN.md.
    }
  }

  return files;
}

async function loadLabMetadata(
  rootDir,
  labFile,
) {
  const source =
    await readFile(
      labFile,
      'utf8',
    );

  const frontMatter =
    parseSimpleFrontMatter(
      source,
    );

  if (
    !parseBoolean(
      frontMatter.tracking,
    )
  ) {
    return null;
  }

  const courseId =
    frontMatter.course_id;

  const labId =
    frontMatter.lab_id;

  validateTrackingId(
    courseId,
    'course_id',
  );

  validateTrackingId(
    labId,
    'lab_id',
  );

  const labNumber =
    parseInteger(
      frontMatter.lab_number,
      'lab_number',
    );

  const position =
    parseInteger(
      frontMatter.position,
      'position',
    );

  const title =
    frontMatter.title?.trim();

  if (!title) {
    throw new Error(
      `${labFile}: title es obligatorio.`,
    );
  }

  const contentPath =
    frontMatter.permalink?.trim();

  if (
    !contentPath ||
    !contentPath.startsWith('/')
  ) {
    throw new Error(
      `${labFile}: permalink debe comenzar con "/".`,
    );
  }

  const manifestFile =
    resolve(
      rootDir,
      '.labcontrol',
      'manifests',
      courseId,
      `${labId}.json`,
    );

  let manifest;

  try {
    manifest =
      JSON.parse(
        await readFile(
          manifestFile,
          'utf8',
        ),
      );
  } catch {
    throw new Error(
      `${labFile}: no existe un manifest generado para ${courseId}/${labId}.`,
    );
  }

  return {
    courseId,
    lab: {
      labId,
      number:
        labNumber,
      position,
      name:
        title,
      durationMinutes:
        parseDurationMinutes(
          frontMatter.duration,
        ),
      contentPath,
      manifest,
    },
  };
}

async function main() {
  const rootDir =
    process.cwd();

  const labsDir =
    resolve(
      rootDir,
      'labs',
    );

  const files =
    await findLabFiles(
      labsDir,
    );

  const courses =
    new Map();

  for (
    const labFile
    of files
  ) {
    const result =
      await loadLabMetadata(
        rootDir,
        labFile,
      );

    if (!result) {
      continue;
    }

    if (
      !courses.has(
        result.courseId,
      )
    ) {
      courses.set(
        result.courseId,
        [],
      );
    }

    courses
      .get(
        result.courseId,
      )
      .push(
        result.lab,
      );
  }

  if (
    courses.size ===
    0
  ) {
    throw new Error(
      'No se encontraron Labs con tracking habilitado.',
    );
  }

  const publicRoot =
    resolve(
      rootDir,
      'labcontrol',
    );

  await mkdir(
    publicRoot,
    {
      recursive:
        true,
    },
  );

  for (
    const [
      courseId,
      labs,
    ]
    of courses
  ) {
    labs.sort(
      (
        left,
        right,
      ) =>
        left.position -
        right.position,
    );

    const seenLabIds =
      new Set();

    const seenNumbers =
      new Set();

    const seenPositions =
      new Set();

    for (
      const lab
      of labs
    ) {
      if (
        seenLabIds.has(
          lab.labId,
        )
      ) {
        throw new Error(
          `${courseId}: lab_id duplicado "${lab.labId}".`,
        );
      }

      if (
        seenNumbers.has(
          lab.number,
        )
      ) {
        throw new Error(
          `${courseId}: lab_number duplicado "${lab.number}".`,
        );
      }

      if (
        seenPositions.has(
          lab.position,
        )
      ) {
        throw new Error(
          `${courseId}: position duplicada "${lab.position}".`,
        );
      }

      if (
        lab.number !==
        lab.position
      ) {
        throw new Error(
          `${courseId}: ${lab.labId} tiene lab_number ${lab.number} pero position ${lab.position}. Ambos deben coincidir.`,
        );
      }

      seenLabIds.add(
        lab.labId,
      );

      seenNumbers.add(
        lab.number,
      );

      seenPositions.add(
        lab.position,
      );
    }

    const expectedSequence =
      Array.from(
        {
          length:
            labs.length,
        },
        (
          _,
          index,
        ) =>
          index + 1,
      );

    const actualNumbers =
      labs
        .map(
          lab =>
            lab.number,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left - right,
        );

    const actualPositions =
      labs
        .map(
          lab =>
            lab.position,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left - right,
        );

    if (
      actualNumbers.join(',') !==
      expectedSequence.join(',')
    ) {
      throw new Error(
        `${courseId}: lab_number debe ser consecutivo 1..${labs.length}. ` +
        `Se encontró: ${actualNumbers.join(', ')}.`,
      );
    }

    if (
      actualPositions.join(',') !==
      expectedSequence.join(',')
    ) {
      throw new Error(
        `${courseId}: position debe ser consecutiva 1..${labs.length}. ` +
        `Se encontró: ${actualPositions.join(', ')}.`,
      );
    }

    const catalog = {
      version:
        CATALOG_VERSION,
      courseId,
      labs,
    };

    const outputDir =
      join(
        publicRoot,
        courseId,
      );

    await mkdir(
      outputDir,
      {
        recursive:
          true,
      },
    );

    const outputFile =
      join(
        outputDir,
        'course.json',
      );

    await writeFile(
      outputFile,
      `${JSON.stringify(
        catalog,
        null,
        2,
      )}\n`,
      'utf8',
    );

    console.log(
      `Curso: ${courseId}`,
    );

    console.log(
      `Labs: ${labs.length}`,
    );

    console.log(
      `Catálogo: ${outputFile}`,
    );
  }
}

main().catch(
  error => {
    fail(
      error instanceof Error
        ? error.message
        : String(error),
    );
  },
);
