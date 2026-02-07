import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import path from "path";

async function onLinux(config) {
  return install(config, [], "libluajit.so");
}

async function onMacOs(config) {
  return install(config, ["MACOSX_DEPLOYMENT_TARGET=10.15"], "libluajit.so");
}

async function onWindows(config) {
  return install(config, [], "lua51.dll", ".exe");
}

async function install(config, args, dlib, binSuffix = "") {
  const version = config.luajitVersion;
  const installPath = config.installPath;
  const targetPath = path.join(installPath, `LuaJIT-${version}`);
  const tar = await tc.downloadTool(
    `https://github.com/LuaJIT/LuaJIT/archive/refs/tags/v${version}.tar.gz`
  );
  await io.mkdirP(targetPath);
  await tc.extractTar(tar, installPath);

  await exec.exec("make", args, {
    cwd: targetPath,
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
