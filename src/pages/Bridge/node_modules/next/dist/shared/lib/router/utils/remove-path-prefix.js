"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.removePathPrefix = removePathPrefix;
var _pathHasPrefix = require("./path-has-prefix");
function removePathPrefix(path, prefix) {
    if ((0, _pathHasPrefix).pathHasPrefix(path, prefix)) {
        const withoutPrefix = path.slice(prefix.length);
        return withoutPrefix.startsWith('/') ? withoutPrefix : `/${withoutPrefix}`;
    }
    return path;
}

//# sourceMappingURL=remove-path-prefix.js.map