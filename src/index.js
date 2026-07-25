import * as core from "@actions/core";

import { load as loadConfig } from "./config.js";
import { installer as luajitInstaller } from "./luajit.js";
import { installer as luaRocksInstaller } from "./luarocks.js";

async function main() {
  const config = loadConfig();
  core.debug(config);

  const luajit = await install(config, luajitInstaller);
  const luarocks = await install(config, luaRocksInstaller, luajit);

  core.setOutput("luajit", luajit.executable);
  core.setOutput("luarocks", luarocks.executable);
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

main().catch((e) => {
  core.debug(e.stack);
  core.error(e.message);
  core.setFailed(e.message);
});
