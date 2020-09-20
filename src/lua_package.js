const exec = require("@actions/exec");

async function install(_config, luarocks, packageNames) {
  for (const name of packageNames) {
    await exec.exec(`${luarocks.executable} install ${name}`, undefined, {});
  }
}

module.exports.installer = {
  onLinux: install,
  onMacOs: install,
  onWindows: install
};
