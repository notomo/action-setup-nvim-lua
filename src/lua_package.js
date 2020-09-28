const exec = require("@actions/exec");

async function install(config, luarocks) {
  for (const name of config.packageNames) {
    await exec.exec(`${luarocks.executable} install ${name}`, undefined, {});
  }
}

module.exports.installer = {
  onLinux: install,
  onMacOs: install,
  onWindows: install
};
