"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isBlockedPage = isBlockedPage;
exports.cleanAmpPath = cleanAmpPath;
exports.isTargetLikeServerless = isTargetLikeServerless;
exports.shouldUseReactRoot = void 0;
var _react = _interopRequireDefault(require("react"));
var _constants = require("../shared/lib/constants");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function isBlockedPage(pathname) {
    return _constants.BLOCKED_PAGES.includes(pathname);
}
function cleanAmpPath(pathname) {
    if (pathname.match(/\?amp=(y|yes|true|1)/)) {
        pathname = pathname.replace(/\?amp=(y|yes|true|1)&?/, "?");
    }
    if (pathname.match(/&amp=(y|yes|true|1)/)) {
        pathname = pathname.replace(/&amp=(y|yes|true|1)/, "");
    }
    pathname = pathname.replace(/\?$/, "");
    return pathname;
}
function isTargetLikeServerless(target) {
    const isServerless = target === "serverless";
    const isServerlessTrace = target === "experimental-serverless-trace";
    return isServerless || isServerlessTrace;
}
const shouldUseReactRoot = parseInt(_react.default.version) >= 18;
exports.shouldUseReactRoot = shouldUseReactRoot;

//# sourceMappingURL=utils.js.map