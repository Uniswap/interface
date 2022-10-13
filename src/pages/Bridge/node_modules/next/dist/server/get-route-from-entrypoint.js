"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getRouteFromEntrypoint;
var _getAppRouteFromEntrypoint = _interopRequireDefault(require("./get-app-route-from-entrypoint"));
var _matchBundle = _interopRequireDefault(require("./match-bundle"));
function getRouteFromEntrypoint(entryFile, app) {
    let pagePath = (0, _matchBundle).default(SERVER_ROUTE_NAME_REGEX, entryFile);
    if (pagePath) {
        return pagePath;
    }
    if (app) {
        pagePath = (0, _getAppRouteFromEntrypoint).default(entryFile);
        if (pagePath) return pagePath;
    }
    // Potentially the passed item is a browser bundle so we try to match that also
    return (0, _matchBundle).default(BROWSER_ROUTE_NAME_REGEX, entryFile);
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
// matches pages/:page*.js
const SERVER_ROUTE_NAME_REGEX = /^pages[/\\](.*)$/;
// matches static/pages/:page*.js
const BROWSER_ROUTE_NAME_REGEX = /^static[/\\]pages[/\\](.*)$/;

//# sourceMappingURL=get-route-from-entrypoint.js.map