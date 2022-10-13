"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = MiddlewareWasmLoader;
exports.raw = void 0;
var _getModuleBuildInfo = require("./get-module-build-info");
var _crypto = _interopRequireDefault(require("crypto"));
function MiddlewareWasmLoader(source) {
    const name = `wasm_${sha1(source)}`;
    const filePath = `edge-chunks/${name}.wasm`;
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    buildInfo.nextWasmMiddlewareBinding = {
        filePath: `server/${filePath}`,
        name
    };
    this.emitFile(`/${filePath}`, source, null);
    return `module.exports = ${name};`;
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function sha1(source) {
    return _crypto.default.createHash("sha1").update(source).digest("hex");
}
const raw = true;
exports.raw = raw;

//# sourceMappingURL=next-middleware-wasm-loader.js.map