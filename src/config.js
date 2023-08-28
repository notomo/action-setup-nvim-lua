const path = require("path");
const core = require("@actions/core");

function getOS() {
  switch (process.platform) {
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      throw new Error(`not supported platform: '${process.platform}'`);
  }
}

function getLuarocksVersion() {
  const version = core.getInput("luarocks-version");
  if (version === "") {
    throw new Error("`luarocks-version` should not be empty");
  }
  return version;
}

function load() {
  let home = process.env.HOME;
  const os = getOS();
  if (os === "windows") {
    home = process.env.USERPROFILE;
  }
  return {
    os: os,
    luajitVersion: "2.1.ROLLING",
    luaRocksVersion: getLuarocksVersion(),
    installPath: path.join(home, ".local")
  };
}

module.exports.load = load;
