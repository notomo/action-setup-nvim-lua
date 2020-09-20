const core = require("@actions/core");

const loadConfig = require("./config").load;
const luaInstaller = require("./lua").installer;
const luaRocksInstaller = require("./luarocks").installer;
const luaPackageInstaller = require("./lua_package").installer;
const vustedInstaller = require("./vusted").installer;

async function main() {
  const config = loadConfig();
  core.debug(config);

  const lua = await install(config, luaInstaller);
  const luarocks = await install(config, luaRocksInstaller, lua);
  await install(config, luaPackageInstaller, luarocks, ["busted"]);
  const vusted = await install(config, vustedInstaller);

  core.setOutput("lua", lua.executable);
  core.setOutput("luarocks", luarocks.executable);
  core.setOutput("vusted", vusted.executable);
}

async function install(config, installer, ...args) {
  switch (config.os) {
    case "linux":
      return installer.onLinux(config, ...args);
    case "macos":
      return installer.onMacOs(config, ...args);
    case "windows":
      return installer.onWindows(config, ...args);
    default:
      throw new Error(`unexpected os: ${config.os}`);
  }
}

main().catch(e => {
  core.debug(e.stack);
  core.error(e.message);
  core.setFailed(e.message);
});
