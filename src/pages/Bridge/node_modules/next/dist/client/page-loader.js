"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _addBasePath = require("./add-base-path");
var _router = require("../shared/lib/router/router");
var _getAssetPathFromRoute = _interop_require_default(require("../shared/lib/router/utils/get-asset-path-from-route"));
var _addLocale = require("./add-locale");
var _isDynamic = require("../shared/lib/router/utils/is-dynamic");
var _parseRelativeUrl = require("../shared/lib/router/utils/parse-relative-url");
var _removeTrailingSlash = require("../shared/lib/router/utils/remove-trailing-slash");
var _routeLoader = require("./route-loader");
class PageLoader {
    getPageList() {
        if (process.env.NODE_ENV === 'production') {
            return (0, _routeLoader).getClientBuildManifest().then((manifest)=>manifest.sortedPages);
        } else {
            if (window.__DEV_PAGES_MANIFEST) {
                return window.__DEV_PAGES_MANIFEST.pages;
            } else {
                this.promisedDevPagesManifest || (this.promisedDevPagesManifest = fetch(`${this.assetPrefix}/_next/static/development/_devPagesManifest.json`).then((res)=>res.json()).then((manifest)=>{
                    window.__DEV_PAGES_MANIFEST = manifest;
                    return manifest.pages;
                }).catch((err)=>{
                    console.log(`Failed to fetch devPagesManifest:`, err);
                    throw new Error(`Failed to fetch _devPagesManifest.json. Is something blocking that network request?\n` + 'Read more: https://nextjs.org/docs/messages/failed-to-fetch-devpagesmanifest');
                }));
                return this.promisedDevPagesManifest;
            }
        }
    }
    getMiddleware() {
        if (process.env.NODE_ENV === 'production') {
            const middlewareMatchers = process.env.__NEXT_MIDDLEWARE_MATCHERS;
            window.__MIDDLEWARE_MATCHERS = middlewareMatchers ? middlewareMatchers : undefined;
            return window.__MIDDLEWARE_MATCHERS;
        } else {
            if (window.__DEV_MIDDLEWARE_MATCHERS) {
                return window.__DEV_MIDDLEWARE_MATCHERS;
            } else {
                if (!this.promisedMiddlewareMatchers) {
                    // TODO: Decide what should happen when fetching fails instead of asserting
                    // @ts-ignore
                    this.promisedMiddlewareMatchers = fetch(`${this.assetPrefix}/_next/static/${this.buildId}/_devMiddlewareManifest.json`).then((res)=>res.json()).then((matchers)=>{
                        window.__DEV_MIDDLEWARE_MATCHERS = matchers;
                        return matchers;
                    }).catch((err)=>{
                        console.log(`Failed to fetch _devMiddlewareManifest`, err);
                    });
                }
                // TODO Remove this assertion as this could be undefined
                return this.promisedMiddlewareMatchers;
            }
        }
    }
    getDataHref(params) {
        const { asPath , href , locale  } = params;
        const { pathname: hrefPathname , query , search  } = (0, _parseRelativeUrl).parseRelativeUrl(href);
        const { pathname: asPathname  } = (0, _parseRelativeUrl).parseRelativeUrl(asPath);
        const route = (0, _removeTrailingSlash).removeTrailingSlash(hrefPathname);
        if (route[0] !== '/') {
            throw new Error(`Route name should start with a "/", got "${route}"`);
        }
        const getHrefForSlug = (path)=>{
            const dataRoute = (0, _getAssetPathFromRoute).default((0, _removeTrailingSlash).removeTrailingSlash((0, _addLocale).addLocale(path, locale)), '.json');
            return (0, _addBasePath).addBasePath(`/_next/data/${this.buildId}${dataRoute}${search}`, true);
        };
        return getHrefForSlug(params.skipInterpolation ? asPathname : (0, _isDynamic).isDynamicRoute(route) ? (0, _router).interpolateAs(hrefPathname, asPathname, query).result : route);
    }
    /**
   * @param {string} route - the route (file-system path)
   */ _isSsg(route) {
        return this.promisedSsgManifest.then((manifest)=>manifest.has(route));
    }
    loadPage(route) {
        return this.routeLoader.loadRoute(route).then((res)=>{
            if ('component' in res) {
                return {
                    page: res.component,
                    mod: res.exports,
                    styleSheets: res.styles.map((o)=>({
                            href: o.href,
                            text: o.content
                        }))
                };
            }
            throw res.error;
        });
    }
    prefetch(route) {
        return this.routeLoader.prefetch(route);
    }
    constructor(buildId, assetPrefix){
        this.routeLoader = (0, _routeLoader).createRouteLoader(assetPrefix);
        this.buildId = buildId;
        this.assetPrefix = assetPrefix;
        this.promisedSsgManifest = new Promise((resolve)=>{
            if (window.__SSG_MANIFEST) {
                resolve(window.__SSG_MANIFEST);
            } else {
                window.__SSG_MANIFEST_CB = ()=>{
                    resolve(window.__SSG_MANIFEST);
                };
            }
        });
    }
}
exports.default = PageLoader;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=page-loader.js.map