"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getMiddlewareRouteMatcher = getMiddlewareRouteMatcher;
var _prepareDestination = require("./prepare-destination");
function getMiddlewareRouteMatcher(matchers) {
    return (pathname, req, query)=>{
        for (const matcher of matchers){
            const routeMatch = new RegExp(matcher.regexp).exec(pathname);
            if (!routeMatch) {
                continue;
            }
            if (matcher.has) {
                const hasParams = (0, _prepareDestination).matchHas(req, matcher.has, query);
                if (!hasParams) {
                    continue;
                }
            }
            return true;
        }
        return false;
    };
}

//# sourceMappingURL=middleware-route-matcher.js.map