"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.normalizePathTrailingSlash = void 0;
var _removeTrailingSlash = require("../shared/lib/router/utils/remove-trailing-slash");
var _parsePath = require("../shared/lib/router/utils/parse-path");
const normalizePathTrailingSlash = (path)=>{
    if (!path.startsWith('/')) {
        return path;
    }
    const { pathname , query , hash  } = (0, _parsePath).parsePath(path);
    if (process.env.__NEXT_TRAILING_SLASH) {
        if (/\.[^/]+\/?$/.test(pathname)) {
            return `${(0, _removeTrailingSlash).removeTrailingSlash(pathname)}${query}${hash}`;
        } else if (pathname.endsWith('/')) {
            return `${pathname}${query}${hash}`;
        } else {
            return `${pathname}/${query}${hash}`;
        }
    }
    return `${(0, _removeTrailingSlash).removeTrailingSlash(pathname)}${query}${hash}`;
};
exports.normalizePathTrailingSlash = normalizePathTrailingSlash;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=normalize-trailing-slash.js.map