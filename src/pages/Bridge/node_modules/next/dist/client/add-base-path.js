"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.addBasePath = addBasePath;
var _addPathPrefix = require("../shared/lib/router/utils/add-path-prefix");
var _normalizeTrailingSlash = require("./normalize-trailing-slash");
const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';
function addBasePath(path, required) {
    if (process.env.__NEXT_MANUAL_CLIENT_BASE_PATH) {
        if (!required) {
            return path;
        }
    }
    return (0, _normalizeTrailingSlash).normalizePathTrailingSlash((0, _addPathPrefix).addPathPrefix(path, basePath));
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=add-base-path.js.map