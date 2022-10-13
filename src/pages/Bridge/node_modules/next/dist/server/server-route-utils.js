"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getCustomRoute = getCustomRoute;
exports.createRedirectRoute = exports.stringifyQuery = exports.createHeaderRoute = void 0;
var _redirectStatus = require("../lib/redirect-status");
var _pathMatch = require("../shared/lib/router/utils/path-match");
var _prepareDestination = require("../shared/lib/router/utils/prepare-destination");
var _requestMeta = require("./request-meta");
var _querystring = require("querystring");
var _url = require("url");
var _utils = require("../shared/lib/utils");
function getCustomRoute(params) {
    const { rule , type , restrictedRedirectPaths  } = params;
    const match = (0, _pathMatch).getPathMatch(rule.source, {
        strict: true,
        removeUnnamedParams: true,
        regexModifier: !rule.internal ? (regex)=>(0, _redirectStatus).modifyRouteRegex(regex, type === "redirect" ? restrictedRedirectPaths : undefined) : undefined
    });
    return {
        ...rule,
        type,
        match,
        name: type,
        fn: async (_req, _res, _params, _parsedUrl)=>({
                finished: false
            })
    };
}
const createHeaderRoute = ({ rule , restrictedRedirectPaths  })=>{
    const headerRoute = getCustomRoute({
        type: "header",
        rule,
        restrictedRedirectPaths
    });
    return {
        match: headerRoute.match,
        matchesBasePath: true,
        matchesLocale: true,
        matchesLocaleAPIRoutes: true,
        matchesTrailingSlash: true,
        has: headerRoute.has,
        type: headerRoute.type,
        name: `${headerRoute.type} ${headerRoute.source} header route`,
        fn: async (_req, res, params, _parsedUrl)=>{
            const hasParams = Object.keys(params).length > 0;
            for (const header of headerRoute.headers){
                let { key , value  } = header;
                if (hasParams) {
                    key = (0, _prepareDestination).compileNonPath(key, params);
                    value = (0, _prepareDestination).compileNonPath(value, params);
                }
                res.setHeader(key, value);
            }
            return {
                finished: false
            };
        }
    };
};
exports.createHeaderRoute = createHeaderRoute;
const stringifyQuery = (req, query)=>{
    const initialQuery = (0, _requestMeta).getRequestMeta(req, "__NEXT_INIT_QUERY") || {};
    const initialQueryValues = Object.values(initialQuery);
    return (0, _querystring).stringify(query, undefined, undefined, {
        encodeURIComponent (value) {
            if (value in initialQuery || initialQueryValues.some((initialQueryVal)=>{
                // `value` always refers to a query value, even if it's nested in an array
                return Array.isArray(initialQueryVal) ? initialQueryVal.includes(value) : initialQueryVal === value;
            })) {
                // Encode keys and values from initial query
                return encodeURIComponent(value);
            }
            return value;
        }
    });
};
exports.stringifyQuery = stringifyQuery;
const createRedirectRoute = ({ rule , restrictedRedirectPaths  })=>{
    const redirectRoute = getCustomRoute({
        type: "redirect",
        rule,
        restrictedRedirectPaths
    });
    return {
        internal: redirectRoute.internal,
        type: redirectRoute.type,
        match: redirectRoute.match,
        matchesBasePath: true,
        matchesLocale: redirectRoute.internal ? undefined : true,
        matchesLocaleAPIRoutes: true,
        matchesTrailingSlash: true,
        has: redirectRoute.has,
        statusCode: redirectRoute.statusCode,
        name: `Redirect route ${redirectRoute.source}`,
        fn: async (req, res, params, parsedUrl)=>{
            const { parsedDestination  } = (0, _prepareDestination).prepareDestination({
                appendParamsToQuery: false,
                destination: redirectRoute.destination,
                params: params,
                query: parsedUrl.query
            });
            const { query  } = parsedDestination;
            delete parsedDestination.query;
            parsedDestination.search = stringifyQuery(req, query);
            let updatedDestination = (0, _url).format(parsedDestination);
            if (updatedDestination.startsWith("/")) {
                updatedDestination = (0, _utils).normalizeRepeatedSlashes(updatedDestination);
            }
            res.redirect(updatedDestination, (0, _redirectStatus).getRedirectStatus(redirectRoute)).body(updatedDestination).send();
            return {
                finished: true
            };
        }
    };
};
exports.createRedirectRoute = createRedirectRoute;

//# sourceMappingURL=server-route-utils.js.map