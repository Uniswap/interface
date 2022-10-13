"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.addPathSuffix = addPathSuffix;
var _parsePath = require("./parse-path");
function addPathSuffix(path, suffix) {
    if (!path.startsWith('/') || !suffix) {
        return path;
    }
    const { pathname , query , hash  } = (0, _parsePath).parsePath(path);
    return `${pathname}${suffix}${query}${hash}`;
}

//# sourceMappingURL=add-path-suffix.js.map