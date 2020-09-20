const core = require("@actions/core");
const exec = require("@actions/exec");
const path = require("path");

async function install(config) {
  const targetPath = path.join(config.installPath, "vusted");
  await exec.exec(
    `git clone https://github.com/notomo/vusted.git ${targetPath}`,
    undefined,
    {}
  );

  const bin = path.join(targetPath, "bin");
  core.addPath(bin);

  return { bin: bin, executable: path.join(bin, "vusted") };
}

module.exports.installer = {
  onLinux: install,
  onMacOs: install,
  onWindows: install
};
