"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.absolutePathToPage = absolutePathToPage;
var _ensureLeadingSlash = require("./ensure-leading-slash");
var _normalizePathSep = require("./normalize-path-sep");
var _path = require("../isomorphic/path");
var _removePagePathTail = require("./remove-page-path-tail");
function absolutePathToPage(pagePath, options) {
    return (0, _removePagePathTail).removePagePathTail((0, _normalizePathSep).normalizePathSep((0, _ensureLeadingSlash).ensureLeadingSlash((0, _path).relative(options.pagesDir, pagePath))), {
        extensions: options.extensions,
        keepIndex: options.keepIndex
    });
}

//# sourceMappingURL=absolute-path-to-page.js.map