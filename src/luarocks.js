const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const io = require("@actions/io");
const path = require("path");
const fs = require("fs");

async function onLinux(config, luajit) {
  const version = config.luaRocksVersion;
  const installPath = config.installPath;
  const prefixPath = path.join(installPath, ".luarocks");
  const dirName = `luarocks-${version}`;
  const targetPath = path.join(installPath, dirName);
  const tar = await tc.downloadTool(
    `https://luarocks.org/releases/${dirName}.tar.gz`
  );
  await io.mkdirP(targetPath);
  await tc.extractTar(tar, installPath);

  await exec.exec(
    "./configure",
    ["--with-lua-bin=" + luajit.bin, "--prefix=" + prefixPath],
    {
      cwd: targetPath,
    }
  );
  await exec.exec("make", undefined, {
    cwd: targetPath,
  });
  await exec.exec("make", ["install"], {
    cwd: targetPath,
  });

  const bin = targetPath;
  core.addPath(bin);

  const module_bin = path.join(bin, "lua_modules/bin");
  core.addPath(module_bin);

  const executable = path.join(bin, "luarocks");
  await exportPath(executable);

  return { bin: bin, executable: executable };
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

  // NOTE: workaround for `could not analyse the runtime used, defaulting to MSVCR80` in luarocks install.
  // The warning causes lfs issue: `pl.path requires LuaFileSystem`
  const installerPath = path.join(targetPath, "install.bat");
  const installerScript = fs.readFileSync(installerPath, { encoding: "utf-8" });
  const patchedScript = installerScript.replace(
    `vars.LUA_RUNTIME = "MSVCR80"`,
    `vars.LUA_RUNTIME = "MSVCRT"`
  );
  fs.writeFileSync(installerPath, patchedScript);

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
      "/Q",
    ],
    {
      cwd: targetPath,
    }
  );

  const bin = luarocksPath;
  core.addPath(bin);

  const executable = path.join(bin, "luarocks.bat");
  await exportPath(executable);

  const module_bin = path.join(bin, "systree/bin");
  core.addPath(module_bin);

  return { bin: bin, executable: executable };
}

async function exportPath(executable) {
  let PATH = "";
  await exec.exec(executable, ["path", "--lr-bin"], {
    listeners: {
      stdout: (data) => {
        PATH += data.toString();
      },
    },
  });
  if (PATH != "") {
    core.addPath(PATH.trim());
  }

  let LUA_PATH = "";
  await exec.exec(executable, ["path", "--lr-path"], {
    listeners: {
      stdout: (data) => {
        LUA_PATH += data.toString();
      },
    },
  });
  if (LUA_PATH != "") {
    core.exportVariable("LUA_PATH", LUA_PATH.trim());
  }

  let LUA_CPATH = "";
  await exec.exec(executable, ["path", "--lr-cpath"], {
    listeners: {
      stdout: (data) => {
        LUA_CPATH += data.toString();
      },
    },
  });
  if (LUA_CPATH != "") {
    core.exportVariable("LUA_CPATH", LUA_CPATH.trim());
  }
}

module.exports.installer = {
  onLinux: onLinux,
  onMacOs: onLinux,
  onWindows: onWindows,
};
