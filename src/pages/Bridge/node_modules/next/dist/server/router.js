"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _requestMeta = require("./request-meta");
var _pathMatch = require("../shared/lib/router/utils/path-match");
var _removeTrailingSlash = require("../shared/lib/router/utils/remove-trailing-slash");
var _normalizeLocalePath = require("../shared/lib/i18n/normalize-locale-path");
var _prepareDestination = require("../shared/lib/router/utils/prepare-destination");
var _removePathPrefix = require("../shared/lib/router/utils/remove-path-prefix");
var _formatNextPathnameInfo = require("../shared/lib/router/utils/format-next-pathname-info");
var _getNextPathnameInfo = require("../shared/lib/router/utils/get-next-pathname-info");
class Router {
    /**
   * context stores information used by the router.
   */ context = new WeakMap();
    constructor({ headers =[] , fsRoutes =[] , rewrites ={
        beforeFiles: [],
        afterFiles: [],
        fallback: []
    } , redirects =[] , catchAllRoute , catchAllMiddleware =[] , dynamicRoutes =[] , pageChecker , useFileSystemPublicRoutes , nextConfig  }){
        this.nextConfig = nextConfig;
        this.headers = headers;
        this.fsRoutes = [
            ...fsRoutes
        ];
        this.rewrites = rewrites;
        this.redirects = redirects;
        this.pageChecker = pageChecker;
        this.catchAllRoute = catchAllRoute;
        this.catchAllMiddleware = catchAllMiddleware;
        this.dynamicRoutes = dynamicRoutes;
        this.useFileSystemPublicRoutes = useFileSystemPublicRoutes;
        // Perform the initial route compilation.
        this.compiledRoutes = this.compileRoutes();
        this.needsRecompilation = false;
    }
    async checkPage(req, pathname) {
        pathname = (0, _normalizeLocalePath).normalizeLocalePath(pathname, this.locales).pathname;
        const context = this.context.get(req);
        if (!context) {
            throw new Error("Invariant: request is not available inside the context, this is an internal error please open an issue.");
        }
        if (context.pageChecks[pathname] !== undefined) {
            return context.pageChecks[pathname];
        }
        const result = await this.pageChecker(pathname);
        context.pageChecks[pathname] = result;
        return result;
    }
    get locales() {
        var ref;
        return ((ref = this.nextConfig.i18n) == null ? void 0 : ref.locales) || [];
    }
    get basePath() {
        return this.nextConfig.basePath || "";
    }
    setDynamicRoutes(dynamicRoutes) {
        this.dynamicRoutes = dynamicRoutes;
        this.needsRecompilation = true;
    }
    setCatchallMiddleware(catchAllMiddleware) {
        this.catchAllMiddleware = catchAllMiddleware;
        this.needsRecompilation = true;
    }
    addFsRoute(fsRoute) {
        // We use unshift so that we're sure the routes is defined before Next's
        // default routes.
        this.fsRoutes.unshift(fsRoute);
        this.needsRecompilation = true;
    }
    compileRoutes() {
        /*
        Desired routes order
        - headers
        - redirects
        - Check filesystem (including pages), if nothing found continue
        - User rewrites (checking filesystem and pages each match)
      */ const [middlewareCatchAllRoute] = this.catchAllMiddleware;
        return [
            ...middlewareCatchAllRoute ? this.fsRoutes.filter((route)=>route.name === "_next/data catchall").map((route)=>({
                    ...route,
                    check: false
                })) : [],
            ...this.headers,
            ...this.redirects,
            ...this.useFileSystemPublicRoutes && middlewareCatchAllRoute ? [
                middlewareCatchAllRoute
            ] : [],
            ...this.rewrites.beforeFiles,
            ...this.fsRoutes,
            // We only check the catch-all route if public page routes hasn't been
            // disabled
            ...this.useFileSystemPublicRoutes ? [
                {
                    type: "route",
                    name: "page checker",
                    match: (0, _pathMatch).getPathMatch("/:path*"),
                    fn: async (req, res, params, parsedUrl, upgradeHead)=>{
                        const pathname = (0, _removeTrailingSlash).removeTrailingSlash(parsedUrl.pathname || "/");
                        if (!pathname) {
                            return {
                                finished: false
                            };
                        }
                        if (await this.checkPage(req, pathname)) {
                            return this.catchAllRoute.fn(req, res, params, parsedUrl, upgradeHead);
                        }
                        return {
                            finished: false
                        };
                    }
                }, 
            ] : [],
            ...this.rewrites.afterFiles,
            ...this.rewrites.fallback.length ? [
                {
                    type: "route",
                    name: "dynamic route/page check",
                    match: (0, _pathMatch).getPathMatch("/:path*"),
                    fn: async (req, res, _params, parsedCheckerUrl, upgradeHead)=>{
                        return {
                            finished: await this.checkFsRoutes(req, res, parsedCheckerUrl, upgradeHead)
                        };
                    }
                },
                ...this.rewrites.fallback, 
            ] : [],
            // We only check the catch-all route if public page routes hasn't been
            // disabled
            ...this.useFileSystemPublicRoutes ? [
                this.catchAllRoute
            ] : [], 
        ];
    }
    async checkFsRoutes(req, res, parsedUrl, upgradeHead) {
        const originalFsPathname = parsedUrl.pathname;
        const fsPathname = (0, _removePathPrefix).removePathPrefix(originalFsPathname, this.basePath);
        for (const route of this.fsRoutes){
            const params = route.match(fsPathname);
            if (params) {
                parsedUrl.pathname = fsPathname;
                const { finished  } = await route.fn(req, res, params, parsedUrl);
                if (finished) {
                    return true;
                }
                parsedUrl.pathname = originalFsPathname;
            }
        }
        let matchedPage = await this.checkPage(req, fsPathname);
        // If we didn't match a page check dynamic routes
        if (!matchedPage) {
            const normalizedFsPathname = (0, _normalizeLocalePath).normalizeLocalePath(fsPathname, this.locales).pathname;
            for (const dynamicRoute of this.dynamicRoutes){
                if (dynamicRoute.match(normalizedFsPathname)) {
                    matchedPage = true;
                }
            }
        }
        // Matched a page or dynamic route so render it using catchAllRoute
        if (matchedPage) {
            const params = this.catchAllRoute.match(parsedUrl.pathname);
            if (!params) {
                throw new Error(`Invariant: could not match params, this is an internal error please open an issue.`);
            }
            parsedUrl.pathname = fsPathname;
            parsedUrl.query._nextBubbleNoFallback = "1";
            const { finished  } = await this.catchAllRoute.fn(req, res, params, parsedUrl, upgradeHead);
            return finished;
        }
        return false;
    }
    async execute(req, res, parsedUrl, upgradeHead) {
        // Only recompile if the routes need to be recompiled, this should only
        // happen in development.
        if (this.needsRecompilation) {
            this.compiledRoutes = this.compileRoutes();
            this.needsRecompilation = false;
        }
        if (this.context.has(req)) {
            throw new Error(`Invariant: request has already been processed: ${req.url}, this is an internal error please open an issue.`);
        }
        this.context.set(req, {
            pageChecks: {}
        });
        try {
            // Create a deep copy of the parsed URL.
            const parsedUrlUpdated = {
                ...parsedUrl,
                query: {
                    ...parsedUrl.query
                }
            };
            for (const route of this.compiledRoutes){
                var ref;
                // only process rewrites for upgrade request
                if (upgradeHead && route.type !== "rewrite") {
                    continue;
                }
                const originalPathname = parsedUrlUpdated.pathname;
                const pathnameInfo = (0, _getNextPathnameInfo).getNextPathnameInfo(originalPathname, {
                    nextConfig: this.nextConfig,
                    parseData: false
                });
                if (pathnameInfo.locale && !route.matchesLocaleAPIRoutes && pathnameInfo.pathname.match(/^\/api(?:\/|$)/)) {
                    continue;
                }
                if ((0, _requestMeta).getRequestMeta(req, "_nextHadBasePath")) {
                    pathnameInfo.basePath = this.basePath;
                }
                const basePath = pathnameInfo.basePath;
                if (!route.matchesBasePath) {
                    pathnameInfo.basePath = "";
                }
                if (route.matchesLocale && parsedUrlUpdated.query.__nextLocale && !pathnameInfo.locale) {
                    pathnameInfo.locale = parsedUrlUpdated.query.__nextLocale;
                }
                if (!route.matchesLocale && pathnameInfo.locale === ((ref = this.nextConfig.i18n) == null ? void 0 : ref.defaultLocale) && pathnameInfo.locale) {
                    pathnameInfo.locale = undefined;
                }
                if (route.matchesTrailingSlash && (0, _requestMeta).getRequestMeta(req, "__nextHadTrailingSlash")) {
                    pathnameInfo.trailingSlash = true;
                }
                const matchPathname = (0, _formatNextPathnameInfo).formatNextPathnameInfo({
                    ignorePrefix: true,
                    ...pathnameInfo
                });
                let params = route.match(matchPathname);
                if (route.has && params) {
                    const hasParams = (0, _prepareDestination).matchHas(req, route.has, parsedUrlUpdated.query);
                    if (hasParams) {
                        Object.assign(params, hasParams);
                    } else {
                        params = false;
                    }
                }
                /**
         * If it is a matcher that doesn't match the basePath (like the public
         * directory) but Next.js is configured to use a basePath that was
         * never there, we consider this an invalid match and keep routing.
         */ if (params && this.basePath && !route.matchesBasePath && !(0, _requestMeta).getRequestMeta(req, "_nextDidRewrite") && !basePath) {
                    continue;
                }
                if (params) {
                    parsedUrlUpdated.pathname = matchPathname;
                    const result = await route.fn(req, res, params, parsedUrlUpdated, upgradeHead);
                    if (result.finished) {
                        return true;
                    }
                    if (result.pathname) {
                        parsedUrlUpdated.pathname = result.pathname;
                    } else {
                        // since the fs route didn't finish routing we need to re-add the
                        // basePath to continue checking with the basePath present
                        parsedUrlUpdated.pathname = originalPathname;
                    }
                    if (result.query) {
                        parsedUrlUpdated.query = {
                            ...(0, _requestMeta).getNextInternalQuery(parsedUrlUpdated.query),
                            ...result.query
                        };
                    }
                    // check filesystem
                    if (route.check && await this.checkFsRoutes(req, res, parsedUrlUpdated)) {
                        return true;
                    }
                }
            }
            // All routes were tested, none were found.
            return false;
        } finally{
            this.context.delete(req);
        }
    }
}
exports.default = Router;

//# sourceMappingURL=router.js.map