"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.formatNextPathnameInfo = formatNextPathnameInfo;
var _removeTrailingSlash = require("./remove-trailing-slash");
var _addPathPrefix = require("./add-path-prefix");
var _addPathSuffix = require("./add-path-suffix");
var _addLocale = require("./add-locale");
function formatNextPathnameInfo(info) {
    let pathname = (0, _addLocale).addLocale(info.pathname, info.locale, info.buildId ? undefined : info.defaultLocale, info.ignorePrefix);
    if (info.buildId) {
        pathname = (0, _addPathSuffix).addPathSuffix((0, _addPathPrefix).addPathPrefix(pathname, `/_next/data/${info.buildId}`), info.pathname === '/' ? 'index.json' : '.json');
    }
    pathname = (0, _addPathPrefix).addPathPrefix(pathname, info.basePath);
    return info.trailingSlash ? !info.buildId && !pathname.endsWith('/') ? (0, _addPathSuffix).addPathSuffix(pathname, '/') : pathname : (0, _removeTrailingSlash).removeTrailingSlash(pathname);
}

//# sourceMappingURL=format-next-pathname-info.js.map