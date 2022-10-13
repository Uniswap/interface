"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.removeBasePath = removeBasePath;
var _hasBasePath = require("./has-base-path");
const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';
function removeBasePath(path) {
    if (process.env.__NEXT_MANUAL_CLIENT_BASE_PATH) {
        if (!(0, _hasBasePath).hasBasePath(path)) {
            return path;
        }
    }
    path = path.slice(basePath.length);
    if (!path.startsWith('/')) path = `/${path}`;
    return path;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=remove-base-path.js.map