"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resolveFrom = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _isError = _interopRequireDefault(require("./is-error"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const Module = require("module");
const resolveFrom = (fromDirectory, moduleId, silent)=>{
    if (typeof fromDirectory !== "string") {
        throw new TypeError(`Expected \`fromDir\` to be of type \`string\`, got \`${typeof fromDirectory}\``);
    }
    if (typeof moduleId !== "string") {
        throw new TypeError(`Expected \`moduleId\` to be of type \`string\`, got \`${typeof moduleId}\``);
    }
    try {
        fromDirectory = _fs.default.realpathSync(fromDirectory);
    } catch (error) {
        if ((0, _isError).default(error) && error.code === "ENOENT") {
            fromDirectory = _path.default.resolve(fromDirectory);
        } else if (silent) {
            return;
        } else {
            throw error;
        }
    }
    const fromFile = _path.default.join(fromDirectory, "noop.js");
    const resolveFileName = ()=>Module._resolveFilename(moduleId, {
            id: fromFile,
            filename: fromFile,
            paths: Module._nodeModulePaths(fromDirectory)
        });
    if (silent) {
        try {
            return resolveFileName();
        } catch (error) {
            return;
        }
    }
    return resolveFileName();
};
exports.resolveFrom = resolveFrom;

//# sourceMappingURL=resolve-from.js.map