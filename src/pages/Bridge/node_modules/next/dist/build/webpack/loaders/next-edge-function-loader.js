"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = middlewareLoader;
var _getModuleBuildInfo = require("./get-module-build-info");
var _stringifyRequest = require("../stringify-request");
function middlewareLoader() {
    const { absolutePagePath , page , rootDir  } = this.getOptions();
    const stringifiedPagePath = (0, _stringifyRequest).stringifyRequest(this, absolutePagePath);
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    buildInfo.nextEdgeApiFunction = {
        page: page || "/"
    };
    buildInfo.rootDir = rootDir;
    return `
        import { adapter, enhanceGlobals } from 'next/dist/server/web/adapter'

        enhanceGlobals()

        var mod = require(${stringifiedPagePath})
        var handler = mod.middleware || mod.default;

        if (typeof handler !== 'function') {
          throw new Error('The Edge Function "pages${page}" must export a \`default\` function');
        }

        export default function (opts) {
          return adapter({
              ...opts,
              page: ${JSON.stringify(page)},
              handler,
          })
        }
    `;
}

//# sourceMappingURL=next-edge-function-loader.js.map