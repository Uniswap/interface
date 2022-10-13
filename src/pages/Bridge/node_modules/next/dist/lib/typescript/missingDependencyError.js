"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.missingDepsError = missingDepsError;
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _oxfordCommaList = require("../oxford-comma-list");
var _fatalError = require("../fatal-error");
var _getPkgManager = require("../helpers/get-pkg-manager");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function missingDepsError(dir, missingPackages) {
    const packagesHuman = (0, _oxfordCommaList).getOxfordCommaList(missingPackages.map((p)=>p.pkg));
    const packagesCli = missingPackages.map((p)=>p.pkg).join(" ");
    const packageManager = (0, _getPkgManager).getPkgManager(dir);
    const removalMsg = "\n\n" + _chalk.default.bold("If you are not trying to use TypeScript, please remove the " + _chalk.default.cyan("tsconfig.json") + " file from your package root (and any TypeScript files in your pages directory).");
    throw new _fatalError.FatalError(_chalk.default.bold.red(`It looks like you're trying to use TypeScript but do not have the required package(s) installed.`) + "\n\n" + _chalk.default.bold(`Please install ${_chalk.default.bold(packagesHuman)} by running:`) + "\n\n" + `\t${_chalk.default.bold.cyan((packageManager === "yarn" ? "yarn add --dev" : packageManager === "pnpm" ? "pnpm install --save-dev" : "npm install --save-dev") + " " + packagesCli)}` + removalMsg + "\n");
}

//# sourceMappingURL=missingDependencyError.js.map