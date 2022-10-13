"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = MiddlewareAssetLoader;
exports.raw = void 0;
var _loaderUtils3 = _interopRequireDefault(require("next/dist/compiled/loader-utils3"));
var _getModuleBuildInfo = require("./get-module-build-info");
function MiddlewareAssetLoader(source) {
    const name = _loaderUtils3.default.interpolateName(this, "[name].[hash].[ext]", {
        context: this.rootContext,
        content: source
    });
    const filePath = `edge-chunks/asset_${name}`;
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    buildInfo.nextAssetMiddlewareBinding = {
        filePath: `server/${filePath}`,
        name
    };
    this.emitFile(filePath, source);
    return `module.exports = ${JSON.stringify(`blob:${name}`)}`;
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const raw = true;
exports.raw = raw;

//# sourceMappingURL=next-middleware-asset-loader.js.map