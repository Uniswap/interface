"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getRedirectStatus = getRedirectStatus;
exports.modifyRouteRegex = modifyRouteRegex;
exports.allowedStatusCodes = void 0;
var _constants = require("../shared/lib/constants");
const allowedStatusCodes = new Set([
    301,
    302,
    303,
    307,
    308
]);
exports.allowedStatusCodes = allowedStatusCodes;
function getRedirectStatus(route) {
    return route.statusCode || (route.permanent ? _constants.PERMANENT_REDIRECT_STATUS : _constants.TEMPORARY_REDIRECT_STATUS);
}
function modifyRouteRegex(regex, restrictedPaths) {
    if (restrictedPaths) {
        regex = regex.replace(/\^/, `^(?!${restrictedPaths.map((path)=>path.replace(/\//g, "\\/")).join("|")})`);
    }
    regex = regex.replace(/\$$/, "(?:\\/)?$");
    return regex;
}

//# sourceMappingURL=redirect-status.js.map