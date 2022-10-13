"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.addPathPrefix = addPathPrefix;
var _parsePath = require("./parse-path");
function addPathPrefix(path, prefix) {
    if (!path.startsWith('/') || !prefix) {
        return path;
    }
    const { pathname , query , hash  } = (0, _parsePath).parsePath(path);
    return `${prefix}${pathname}${query}${hash}`;
}

//# sourceMappingURL=add-path-prefix.js.map