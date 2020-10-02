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

  const LUA_PATH =
    path.join(targetPath, "lua_modules/share/lua/5.1/?.lua;") +
    path.join(targetPath, "lua_modules/share/lua/5.1/?/init.lua");
  core.exportVariable("LUA_PATH", LUA_PATH);
  core.debug(`LUA_PATH=${LUA_PATH}`);

  const LUA_CPATH = path.join(targetPath, "lua_modules/lib/lua/5.1/?.so");
  core.exportVariable("LUA_CPATH", LUA_CPATH);
  core.debug(`LUA_CPATH=${LUA_CPATH}`);

  const module_bin = path.join(targetPath, "lua_modules/bin");
  core.addPath(module_bin);

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

  const LUA_PATH =
    path.join(luarocksPath, "systree/share/lua/5.1/?.lua;") +
    path.join(luarocksPath, "systree/share/lua/5.1/?/init.lua");
  core.exportVariable("LUA_PATH", LUA_PATH);
  core.debug(`LUA_PATH=${LUA_PATH}`);

  const LUA_CPATH = path.join(luarocksPath, "systree/lib/lua/5.1/?.dll");
  core.exportVariable("LUA_CPATH", LUA_CPATH);
  core.debug(`LUA_CPATH=${LUA_CPATH}`);

  const module_bin = path.join(luarocksPath, "systree/bin");
  core.addPath(module_bin);

  return { bin: bin, executable: path.join(bin, "luarocks.bat") };
}

module.exports.installer = {
  onLinux: onLinux,
  onMacOs: onLinux,
  onWindows: onWindows
};
