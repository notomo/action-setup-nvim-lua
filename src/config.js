const path = require("path");

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

function load() {
  let home = process.env.HOME;
  const os = getOS();
  if (os === "windows") {
    home = process.env.USERPROFILE;
  }
  return {
    os: os,
    luajitVersion: "2.1.0-beta3",
    luaRocksVersion: "3.3.1",
    packageNames: ["busted"],
    installPath: path.join(home, ".local")
  };
}

module.exports.load = load;
