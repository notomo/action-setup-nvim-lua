import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import path from "path";
import fs from "fs";

async function onLinux(config) {
  return install(config, { dlib: "libluajit.so" });
}

async function onMacOs(config) {
  return install(config, {
    dlib: "libluajit.so",
    env: { MACOSX_DEPLOYMENT_TARGET: await deploymentTarget() },
  });
}

// NOTE: luarocks derives the same target for building rocks, so keep them in sync.
// arm64 has no target below 11.0 anyway.
async function deploymentTarget() {
  const { stdout } = await exec.getExecOutput("sw_vers", ["-productVersion"], {
    silent: true,
  });
  const major = Number(stdout.trim().split(".")[0]);
  return major >= 11 ? "11.0" : "10.8";
}

async function onWindows(config) {
  // NOTE: src/Makefile emits cmd.exe syntax once it detects a non-MSYS Windows host,
  // so pin the shell instead of letting make pick up a bash from PATH.
  return install(config, {
    dlib: "lua51.dll",
    binSuffix: ".exe",
    makeArgs: ["SHELL=cmd.exe"],
  });
}

async function install(
  config,
  { dlib, binSuffix = "", env = {}, makeArgs = [] },
) {
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

  await exec.exec("make", makeArgs, {
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
