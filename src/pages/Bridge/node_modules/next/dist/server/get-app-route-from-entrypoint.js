"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getAppRouteFromEntrypoint;
var _matchBundle = _interopRequireDefault(require("./match-bundle"));
function getAppRouteFromEntrypoint(entryFile) {
    const pagePath = (0, _matchBundle).default(APP_ROUTE_NAME_REGEX, entryFile);
    if (typeof pagePath === "string" && !pagePath) {
        return "/";
    }
    if (!pagePath) {
        return null;
    }
    return pagePath;
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
// matches app/:path*.js
const APP_ROUTE_NAME_REGEX = /^app[/\\](.*)$/;

//# sourceMappingURL=get-app-route-from-entrypoint.js.map