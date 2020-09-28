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
    luajitVersion: "2.1.0-beta3",
    luaRocksVersion: "3.3.1",
    packageNames: ["busted"],
    installPath: path.join(process.env.HOME, ".local")
  };
}

module.exports.load = load;
