"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.normalizePagePath = normalizePagePath;
var _ensureLeadingSlash = require("./ensure-leading-slash");
var _utils = require("../router/utils");
var _utils1 = require("../utils");
function normalizePagePath(page) {
    const normalized = (0, _ensureLeadingSlash).ensureLeadingSlash(/^\/index(\/|$)/.test(page) && !(0, _utils).isDynamicRoute(page) ? `/index${page}` : page === '/' ? '/index' : page);
    if (process.env.NEXT_RUNTIME !== 'edge') {
        const { posix  } = require('path');
        const resolvedPage = posix.normalize(normalized);
        if (resolvedPage !== normalized) {
            throw new _utils1.NormalizeError(`Requested and resolved page mismatch: ${normalized} ${resolvedPage}`);
        }
    }
    return normalized;
}

//# sourceMappingURL=normalize-page-path.js.map