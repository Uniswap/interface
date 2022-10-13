"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.denormalizePagePath = denormalizePagePath;
var _utils = require("../router/utils");
var _normalizePathSep = require("./normalize-path-sep");
function denormalizePagePath(page) {
    let _page = (0, _normalizePathSep).normalizePathSep(page);
    return _page.startsWith('/index/') && !(0, _utils).isDynamicRoute(_page) ? _page.slice(6) : _page !== '/index' ? _page : '/';
}

//# sourceMappingURL=denormalize-page-path.js.map