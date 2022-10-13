"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = middlewareLoader;
exports.encodeMatchers = encodeMatchers;
exports.decodeMatchers = decodeMatchers;
var _getModuleBuildInfo = require("./get-module-build-info");
var _stringifyRequest = require("../stringify-request");
var _constants = require("../../../lib/constants");
function middlewareLoader() {
    const { absolutePagePath , page , rootDir , matchers: encodedMatchers ,  } = this.getOptions();
    const matchers = encodedMatchers ? decodeMatchers(encodedMatchers) : undefined;
    const stringifiedPagePath = (0, _stringifyRequest).stringifyRequest(this, absolutePagePath);
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    buildInfo.nextEdgeMiddleware = {
        matchers,
        page: page.replace(new RegExp(`/${_constants.MIDDLEWARE_LOCATION_REGEXP}$`), "") || "/"
    };
    buildInfo.rootDir = rootDir;
    return `
        import { adapter, blockUnallowedResponse, enhanceGlobals } from 'next/dist/server/web/adapter'

        enhanceGlobals()

        var mod = require(${stringifiedPagePath})
        var handler = mod.middleware || mod.default;

        if (typeof handler !== 'function') {
          throw new Error('The Middleware "pages${page}" must export a \`middleware\` or a \`default\` function');
        }

        export default function (opts) {
          return blockUnallowedResponse(adapter({
              ...opts,
              page: ${JSON.stringify(page)},
              handler,
          }))
        }
    `;
}
function encodeMatchers(matchers) {
    return Buffer.from(JSON.stringify(matchers)).toString("base64");
}
function decodeMatchers(encodedMatchers) {
    return JSON.parse(Buffer.from(encodedMatchers, "base64").toString());
}

//# sourceMappingURL=next-middleware-loader.js.map