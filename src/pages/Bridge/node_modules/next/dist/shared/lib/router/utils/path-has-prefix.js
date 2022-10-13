"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.pathHasPrefix = pathHasPrefix;
var _parsePath = require("./parse-path");
function pathHasPrefix(path, prefix) {
    if (typeof path !== 'string') {
        return false;
    }
    const { pathname  } = (0, _parsePath).parsePath(path);
    return pathname === prefix || pathname.startsWith(prefix + '/');
}

//# sourceMappingURL=path-has-prefix.js.map