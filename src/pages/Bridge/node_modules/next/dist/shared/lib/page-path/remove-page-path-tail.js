"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.removePagePathTail = removePagePathTail;
var _normalizePathSep = require("./normalize-path-sep");
function removePagePathTail(pagePath, options) {
    pagePath = (0, _normalizePathSep).normalizePathSep(pagePath).replace(new RegExp(`\\.+(?:${options.extensions.join('|')})$`), '');
    if (options.keepIndex !== true) {
        pagePath = pagePath.replace(/\/index$/, '') || '/';
    }
    return pagePath;
}

//# sourceMappingURL=remove-page-path-tail.js.map