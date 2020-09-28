const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const io = require("@actions/io");
const path = require("path");

async function onLinux(config, luajit) {
  const version = config.luaRocksVersion;
  const installPath = config.installPath;
  const dirName = `luarocks-${version}`;
  const targetPath = path.join(installPath, dirName);
  const tar = await tc.downloadTool(
    `https://luarocks.org/releases/${dirName}.tar.gz`
  );
  await io.mkdirP(targetPath);
  await tc.extractTar(tar, installPath);

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
  const version = config.luaRocksVersion;
  const installPath = config.installPath;
  const dirName = `luarocks-${version}-win32`;
  const targetPath = path.join(installPath, dirName);
  const zip = await tc.downloadTool(
    `https://luarocks.org/releases/${dirName}.zip`
  );
  await io.mkdirP(targetPath);
  await tc.extractZip(zip, installPath);

  const luarocksPath = path.join(luajit.root, "luarocks");
  await exec.exec(
    "./install.bat",
    [
      "/F",
      "/MW",
      "/LUA",
      luajit.root,
      "/LIB",
      luajit.bin,
      "/P",
      luarocksPath,
      "/NOADMIN",
      "/SELFCONTAINED",
      "/Q"
    ],
    {
      cwd: targetPath
    }
  );

  const bin = luarocksPath;
  core.addPath(bin);

  return { bin: bin, executable: path.join(bin, "luarocks.bat") };
}

module.exports.installer = {
  onLinux: onLinux,
  onMacOs: onLinux,
  onWindows: onWindows
};
