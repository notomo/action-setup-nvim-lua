const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const io = require("@actions/io");
const path = require("path");

async function onLinux(config) {
  return install(config, "libluajit.so");
}

async function onMacOs(config) {
  return install(config, "libluajit.so");
}

async function onWindows(config) {
  return install(config, "lua51.dll", ".exe");
}

async function install(config, dlib, binSuffix = "") {
  const version = config.luajitVersion;
  const installPath = config.installPath;
  const targetPath = path.join(installPath, `LuaJIT-${version}`);
  const tar = await tc.downloadTool(
    `https://luajit.org/download/LuaJIT-${version}.tar.gz`
  );
  await io.mkdirP(targetPath);
  await tc.extractTar(tar, installPath);

  await exec.exec("make", undefined, {
    cwd: targetPath
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
    root: targetPath
  };
}

module.exports.installer = {
  onLinux: onLinux,
  onMacOs: onMacOs,
  onWindows: onWindows
};
