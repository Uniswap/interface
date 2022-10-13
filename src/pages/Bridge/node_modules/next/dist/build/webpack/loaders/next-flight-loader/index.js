"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = transformSource;
var _constants = require("../../../../shared/lib/constants");
var _getPageStaticInfo = require("../../../analysis/get-page-static-info");
var _swc = require("../../../swc");
var _getModuleBuildInfo = require("../get-module-build-info");
async function transformSource(source, sourceMap) {
    var ref;
    // Avoid buffer to be consumed
    if (typeof source !== "string") {
        throw new Error("Expected source to have been transformed to a string.");
    }
    const { resourcePath  } = this;
    const callback = this.async();
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    const swcAST = await (0, _swc).parse(source, {
        filename: resourcePath,
        isModule: "unknown"
    });
    const rscType = (0, _getPageStaticInfo).getRSCModuleType(source);
    // Assign the RSC meta information to buildInfo.
    // Exclude next internal files which are not marked as client files
    buildInfo.rsc = {
        type: rscType
    };
    if (((ref = buildInfo.rsc) == null ? void 0 : ref.type) === _constants.RSC_MODULE_TYPES.client) {
        return callback(null, source, sourceMap);
    }
    const isModule = swcAST.type === "Module";
    const code = transformServer(source, isModule);
    return callback(null, code, sourceMap);
}
function transformServer(source, isESModule) {
    return source + (isESModule ? `export const __next_rsc__` : `exports.__next_rsc__`) + ` = { __webpack_require__, server: true }\n`;
}

//# sourceMappingURL=index.js.map