"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = transformSource;
var _constants = require("../../../shared/lib/constants");
var _getModuleBuildInfo = require("./get-module-build-info");
async function transformSource() {
    let { modules , server  } = this.getOptions();
    const isServer = server === "true";
    if (!Array.isArray(modules)) {
        modules = modules ? [
            modules
        ] : [];
    }
    const requests = modules;
    const code = requests// Filter out css files on the server
    .filter((request)=>isServer ? !request.endsWith(".css") : true).map((request)=>request.endsWith(".css") ? `(() => import(/* webpackMode: "lazy" */ ${JSON.stringify(request)}))` : `import(/* webpackMode: "eager" */ ${JSON.stringify(request)})`).join(";\n") + `
    export const __next_rsc__ = {
      server: false,
      __webpack_require__
    };
    export default function RSC() {};
    `;
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    buildInfo.rsc = {
        type: _constants.RSC_MODULE_TYPES.client,
        requests
    };
    return code;
}

//# sourceMappingURL=next-flight-client-entry-loader.js.map