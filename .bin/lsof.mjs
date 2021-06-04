#!/usr/bin/env node

import { promises as fs } from "fs";
import { createRequire } from "module";
import os from "os";
import { dirname, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { $, cd, chalk, fetch, question, sleep } from "zx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// exec with string result
async function $$(...args) {
  $.verbose = false;
  const result = await $(...args);
  $.verbose = true;

  return result.toString().trim();
}

Object.assign(global, {
  $,
  $$,
  cd,
  fetch,
  question,
  chalk,
  sleep,
  fs,
  os,

  SHELL_DIR: process.cwd(),
  CI_DIR: resolve(__dirname, "../"),
});

async function importPath(filepath) {
  let __filename = resolve(filepath);
  let __dirname = dirname(__filename);
  let require = createRequire(filepath);

  Object.assign(global, { __filename, __dirname, require });
  await import(pathToFileURL(filepath));
}

await importPath(resolve(__dirname, "../index.mjs"));
