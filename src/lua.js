const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const io = require("@actions/io");
const path = require("path");

async function onLinux(config) {
  const version = config.luaVersion;
  const installPath = config.installPath;
  const targetPath = path.join(installPath, `lua-${version}`);
  const tar = await tc.downloadTool(
    `http://www.lua.org/ftp/lua-${version}.tar.gz`
  );
  await io.mkdirP(targetPath);
  await tc.extractTar(tar, installPath);

  await exec.exec("make linux", undefined, {
    cwd: targetPath
  });
  await exec.exec(`make install INSTALL_TOP=${targetPath}`, undefined, {
    cwd: targetPath
  });

  const bin = path.join(targetPath, "bin");
  core.addPath(bin);

  return { bin: bin, executable: path.join(bin, "lua") };
}

async function onMacOs(_config) {
  throw new Error("not implemented");
}

async function onWindows(_config) {
  throw new Error("not implemented");
}

module.exports.installer = {
  onLinux: onLinux,
  onMacOs: onMacOs,
  onWindows: onWindows
};
