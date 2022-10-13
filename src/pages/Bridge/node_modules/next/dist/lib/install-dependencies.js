"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.installDependencies = installDependencies;
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _path = _interopRequireDefault(require("path"));
var _getPkgManager = require("./helpers/get-pkg-manager");
var _install = require("./helpers/install");
var _getOnline = require("./helpers/get-online");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function installDependencies(baseDir, deps, dev = false) {
    const packageManager = (0, _getPkgManager).getPkgManager(baseDir);
    const isOnline = await (0, _getOnline).getOnline();
    if (deps.length) {
        console.log();
        console.log(`Installing ${dev ? "devDependencies" : "dependencies"} (${packageManager}):`);
        for (const dep1 of deps){
            console.log(`- ${_chalk.default.cyan(dep1.pkg)}`);
        }
        console.log();
        await (0, _install).install(_path.default.resolve(baseDir), deps.map((dep)=>dep.pkg), {
            devDependencies: dev,
            isOnline,
            packageManager
        });
        console.log();
    }
}

//# sourceMappingURL=install-dependencies.js.map