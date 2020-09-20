const path = require("path");

function os() {
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

function load() {
  return {
    os: os(),
    luaVersion: "5.3.5",
    luaRocksVersion: "3.3.1",
    installPath: path.join(process.env.HOME, ".local")
  };
}

module.exports.load = load;
