#!/usr/bin/env node

import fs from "fs-extra";
import { createRequire } from "module";
import os from "os";
import { dirname, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { $, cd, chalk, fetch, question, sleep } from "zx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INIT_MAPPING = {
  // this is dangerous, carefully use
  quote: () => {
    const q = $.quote;
    $.quote = (v) => v;

    return () => {
      $.quote = q;
    };
  },

  verbose: () => {
    const v = $.verbose;
    $.verbose = false;

    return () => {
      $.verbose = v;
    };
  },
};

function $$(k, ...apis) {
  return async (...args) => {
    let CUSTOM_MAPPING = { ...INIT_MAPPING };
    // 也是一个 api
    if (typeof k === "string") {
      apis.unshift(k);
    }
    // api 列表
    else if (Array.isArray(k)) {
      apis.unshift(...k);
    }
    // MAPPING 覆盖
    else {
      CUSTOM_MAPPING = {
        ...CUSTOM_MAPPING,
        ...k,
      };
    }

    // 依次执行函数, 并保存恢复函数
    let resetList = [];
    for (const api of apis) {
      let fn = CUSTOM_MAPPING[api];

      if (!fn) {
        console.warn(`${api} not support, skip`);
        continue;
      }
      const restFn = await fn(...args);

      if (!restFn) {
        continue;
      }

      resetList.push(restFn);
    }

    // 执行
    const result = await $(...args);

    // 恢复
    for (const fn of resetList) {
      await fn();
    }

    return result;
  };
}

// 不转义执行, 存在风险
$.noQuote = async (...args) => {
  return $$("quote")(...args);
};

// 无执行命令 结果输出
$.noVerbose = async (...args) => {
  return $$("verbose")(...args);
};

// exec with string result
$.toString = async (...args) => {
  const result = await $(...args);
  return result.toString().trim();
};

// noVerbose + toString
$.toString2 = async (...args) => {
  const result = await $.noVerbose(...args);
  return result.toString().trim();
};

// cmd
$.switch2cmd = () => {
  $.shell = "C:\\WINDOWS\\system32\\cmd.exe";
  $.prefix = "";
};

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
