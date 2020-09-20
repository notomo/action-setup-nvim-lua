const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const io = require("@actions/io");
const path = require("path");

async function onLinux(config, lua) {
  const version = config.luaRocksVersion;
  const installPath = config.installPath;
  const targetPath = path.join(installPath, `luarocks-${version}`);
  const tar = await tc.downloadTool(
    `https://luarocks.org/releases/luarocks-${version}.tar.gz`
  );
  await io.mkdirP(targetPath);
  await tc.extractTar(tar, installPath);

  await exec.exec(`./configure --with-lua-bin=${lua.bin}`, undefined, {
    cwd: targetPath
  });

  await exec.exec("make", undefined, {
    cwd: targetPath
  });

  const bin = targetPath;
  core.addPath(bin);

  await exec.exec("luarocks --version");

  return { bin: bin, executable: path.join(bin, "luarocks") };
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
