import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import path from "path";
import fs from "fs";

async function onLinux(config) {
  return install(config, {}, "libluajit.so");
}

async function onMacOs(config) {
  return install(config, { MACOSX_DEPLOYMENT_TARGET: "10.15" }, "libluajit.so");
}

async function onWindows(config) {
  return install(config, {}, "lua51.dll", ".exe");
}

async function install(config, env, dlib, binSuffix = "") {
  const installPath = config.installPath;
  const targetPath = path.join(installPath, "LuaJIT");
  const extractPath = path.join(installPath, "LuaJIT-archive");

  const tar = await tc.downloadTool(
    `https://github.com/LuaJIT/LuaJIT/archive/refs/heads/${config.luajitRef}.tar.gz`,
  );
  await io.rmRF(extractPath);
  await tc.extractTar(tar, extractPath);

  const entries = await fs.promises.readdir(extractPath, {
    withFileTypes: true,
  });
  const roots = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  if (roots.length !== 1) {
    throw new Error(`unexpected LuaJIT archive layout: [${roots.join(", ")}]`);
  }
  await io.rmRF(targetPath);
  await io.mv(path.join(extractPath, roots[0]), targetPath);
  await io.rmRF(extractPath);

  await exec.exec("make", [], {
    cwd: targetPath,
    env: { ...process.env, ...env },
  });

  const exe = "luajit" + binSuffix;

  const src = path.join(targetPath, "src");
  const bin = path.join(targetPath, "bin");
  await io.mkdirP(bin);
  await io.cp(path.join(src, exe), path.join(bin, exe));
  await io.cp(path.join(src, dlib), path.join(bin, dlib));

  const lib = path.join(targetPath, "lib");
  await io.mkdirP(lib);
  await io.cp(path.join(src, dlib), path.join(lib, dlib));

  const include = path.join(targetPath, "include");
  await io.mv(src, include);

  core.addPath(bin);

  return {
    bin: bin,
    executable: path.join(bin, exe),
    lib: lib,
    root: targetPath,
  };
}

export const installer = {
  onLinux: onLinux,
  onMacOs: onMacOs,
  onWindows: onWindows,
};
