"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.hasBasePath = hasBasePath;
var _pathHasPrefix = require("../shared/lib/router/utils/path-has-prefix");
const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';
function hasBasePath(path) {
    return (0, _pathHasPrefix).pathHasPrefix(path, basePath);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=has-base-path.js.map