const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const io = require("@actions/io");
const path = require("path");

async function download(config) {
  const version = config.luaRocksVersion;
  const installPath = config.installPath;
  const targetPath = path.join(installPath, `luarocks-${version}`);
  const tar = await tc.downloadTool(
    `https://luarocks.org/releases/luarocks-${version}.tar.gz`
  );
  await io.mkdirP(targetPath);
  await tc.extractTar(tar, installPath);

  return targetPath;
}

async function onLinux(config, luajit) {
  const targetPath = await download(config);

  await exec.exec("./configure", ["--with-lua-bin=" + luajit.bin], {
    cwd: targetPath
  });
  await exec.exec("make", undefined, {
    cwd: targetPath
  });

  const bin = targetPath;
  core.addPath(bin);

  return { bin: bin, executable: path.join(bin, "luarocks") };
}

async function onWindows(config, luajit) {
  const targetPath = await download(config);

  await exec.exec(
    "install.bat",
    [
      "/F",
      "/MW",
      "/LUA",
      luajit.root,
      "/LIB",
      luajit.bin,
      "/P",
      luajit.root,
      "/NOADMIN",
      "/SELFCONTAINED",
      "/Q"
    ],
    {
      cwd: targetPath
    }
  );

  const bin = targetPath;
  core.addPath(bin);

  return { bin: bin, executable: path.join(bin, "luarocks.bat") };
}

module.exports.installer = {
  onLinux: onLinux,
  onMacOs: onLinux,
  onWindows: onWindows
};
