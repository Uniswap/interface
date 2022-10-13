"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _baseServer = _interopRequireWildcard(require("./base-server"));
var _web = require("./api-utils/web");
var _etag = require("./lib/etag");
var _requestMeta = require("./request-meta");
var _web1 = _interopRequireDefault(require("./response-cache/web"));
var _pathMatch = require("../shared/lib/router/utils/path-match");
var _getRouteFromAssetPath = _interopRequireDefault(require("../shared/lib/router/utils/get-route-from-asset-path"));
var _detectDomainLocale = require("../shared/lib/i18n/detect-domain-locale");
var _normalizeLocalePath = require("../shared/lib/i18n/normalize-locale-path");
var _removeTrailingSlash = require("../shared/lib/router/utils/remove-trailing-slash");
class NextWebServer extends _baseServer.default {
    constructor(options){
        super(options);
        // Extend `renderOpts`.
        Object.assign(this.renderOpts, options.webServerConfig.extendRenderOpts);
    }
    handleCompression() {
    // For the web server layer, compression is automatically handled by the
    // upstream proxy (edge runtime or node server) and we can simply skip here.
    }
    getResponseCache() {
        return new _web1.default(this.minimalMode);
    }
    getCustomRoutes() {
        return {
            headers: [],
            rewrites: {
                fallback: [],
                afterFiles: [],
                beforeFiles: []
            },
            redirects: []
        };
    }
    async run(req, res, parsedUrl) {
        super.run(req, res, parsedUrl);
    }
    async hasPage(page) {
        return page === this.serverOptions.webServerConfig.page;
    }
    getPublicDir() {
        // Public files are not handled by the web server.
        return "";
    }
    getBuildId() {
        return this.serverOptions.webServerConfig.extendRenderOpts.buildId;
    }
    loadEnvConfig() {
    // The web server does not need to load the env config. This is done by the
    // runtime already.
    }
    getHasStaticDir() {
        return false;
    }
    async getFallback() {
        return "";
    }
    getFontManifest() {
        return undefined;
    }
    getPagesManifest() {
        return {
            [this.serverOptions.webServerConfig.page]: ""
        };
    }
    getAppPathsManifest() {
        return {
            [this.serverOptions.webServerConfig.page]: ""
        };
    }
    getFilesystemPaths() {
        return new Set();
    }
    attachRequestMeta(req, parsedUrl) {
        (0, _requestMeta).addRequestMeta(req, "__NEXT_INIT_QUERY", {
            ...parsedUrl.query
        });
    }
    getPrerenderManifest() {
        return {
            version: 3,
            routes: {},
            dynamicRoutes: {},
            notFoundRoutes: [],
            preview: {
                previewModeId: "",
                previewModeSigningKey: "",
                previewModeEncryptionKey: ""
            }
        };
    }
    getServerComponentManifest() {
        return this.serverOptions.webServerConfig.extendRenderOpts.serverComponentManifest;
    }
    getServerCSSManifest() {
        return this.serverOptions.webServerConfig.extendRenderOpts.serverCSSManifest;
    }
    generateRoutes() {
        const fsRoutes = [
            {
                match: (0, _pathMatch).getPathMatch("/_next/data/:path*"),
                type: "route",
                name: "_next/data catchall",
                check: true,
                fn: async (req, res, params, _parsedUrl)=>{
                    // Make sure to 404 for /_next/data/ itself and
                    // we also want to 404 if the buildId isn't correct
                    if (!params.path || params.path[0] !== this.buildId) {
                        await this.render404(req, res, _parsedUrl);
                        return {
                            finished: true
                        };
                    }
                    // remove buildId from URL
                    params.path.shift();
                    const lastParam = params.path[params.path.length - 1];
                    // show 404 if it doesn't end with .json
                    if (typeof lastParam !== "string" || !lastParam.endsWith(".json")) {
                        await this.render404(req, res, _parsedUrl);
                        return {
                            finished: true
                        };
                    }
                    // re-create page's pathname
                    let pathname = `/${params.path.join("/")}`;
                    pathname = (0, _getRouteFromAssetPath).default(pathname, ".json");
                    // ensure trailing slash is normalized per config
                    if (this.router.catchAllMiddleware[0]) {
                        if (this.nextConfig.trailingSlash && !pathname.endsWith("/")) {
                            pathname += "/";
                        }
                        if (!this.nextConfig.trailingSlash && pathname.length > 1 && pathname.endsWith("/")) {
                            pathname = pathname.substring(0, pathname.length - 1);
                        }
                    }
                    if (this.nextConfig.i18n) {
                        const { host  } = (req == null ? void 0 : req.headers) || {};
                        // remove port from host and remove port if present
                        const hostname = host == null ? void 0 : host.split(":")[0].toLowerCase();
                        const localePathResult = (0, _normalizeLocalePath).normalizeLocalePath(pathname, this.nextConfig.i18n.locales);
                        const { defaultLocale  } = (0, _detectDomainLocale).detectDomainLocale(this.nextConfig.i18n.domains, hostname) || {};
                        let detectedLocale = "";
                        if (localePathResult.detectedLocale) {
                            pathname = localePathResult.pathname;
                            detectedLocale = localePathResult.detectedLocale;
                        }
                        _parsedUrl.query.__nextLocale = detectedLocale;
                        _parsedUrl.query.__nextDefaultLocale = defaultLocale || this.nextConfig.i18n.defaultLocale;
                        if (!detectedLocale && !this.router.catchAllMiddleware[0]) {
                            _parsedUrl.query.__nextLocale = _parsedUrl.query.__nextDefaultLocale;
                            await this.render404(req, res, _parsedUrl);
                            return {
                                finished: true
                            };
                        }
                    }
                    return {
                        pathname,
                        query: {
                            ..._parsedUrl.query,
                            __nextDataReq: "1"
                        },
                        finished: false
                    };
                }
            },
            {
                match: (0, _pathMatch).getPathMatch("/_next/:path*"),
                type: "route",
                name: "_next catchall",
                // This path is needed because `render()` does a check for `/_next` and the calls the routing again
                fn: async (req, res, _params, parsedUrl)=>{
                    await this.render404(req, res, parsedUrl);
                    return {
                        finished: true
                    };
                }
            }, 
        ];
        const catchAllRoute = {
            match: (0, _pathMatch).getPathMatch("/:path*"),
            type: "route",
            matchesLocale: true,
            name: "Catchall render",
            fn: async (req, res, _params, parsedUrl)=>{
                let { pathname , query  } = parsedUrl;
                if (!pathname) {
                    throw new Error("pathname is undefined");
                }
                // next.js core assumes page path without trailing slash
                pathname = (0, _removeTrailingSlash).removeTrailingSlash(pathname);
                if (this.nextConfig.i18n) {
                    var ref;
                    const localePathResult = (0, _normalizeLocalePath).normalizeLocalePath(pathname, (ref = this.nextConfig.i18n) == null ? void 0 : ref.locales);
                    if (localePathResult.detectedLocale) {
                        pathname = localePathResult.pathname;
                        parsedUrl.query.__nextLocale = localePathResult.detectedLocale;
                    }
                }
                const bubbleNoFallback = !!query._nextBubbleNoFallback;
                if (pathname === "/api" || pathname.startsWith("/api/")) {
                    delete query._nextBubbleNoFallback;
                }
                try {
                    await this.render(req, res, pathname, query, parsedUrl, true);
                    return {
                        finished: true
                    };
                } catch (err) {
                    if (err instanceof _baseServer.NoFallbackError && bubbleNoFallback) {
                        return {
                            finished: false
                        };
                    }
                    throw err;
                }
            }
        };
        const { useFileSystemPublicRoutes  } = this.nextConfig;
        if (useFileSystemPublicRoutes) {
            this.appPathRoutes = this.getAppPathRoutes();
            this.dynamicRoutes = this.getDynamicRoutes();
        }
        return {
            headers: [],
            fsRoutes,
            rewrites: {
                beforeFiles: [],
                afterFiles: [],
                fallback: []
            },
            redirects: [],
            catchAllRoute,
            catchAllMiddleware: [],
            useFileSystemPublicRoutes,
            dynamicRoutes: this.dynamicRoutes,
            pageChecker: this.hasPage.bind(this),
            nextConfig: this.nextConfig
        };
    }
    // Edge API requests are handled separately in minimal mode.
    async handleApiRequest() {
        return false;
    }
    async renderHTML(req, _res, pathname, query, renderOpts) {
        const { pagesRenderToHTML , appRenderToHTML  } = this.serverOptions.webServerConfig;
        const curRenderToHTML = pagesRenderToHTML || appRenderToHTML;
        if (curRenderToHTML) {
            return await curRenderToHTML({
                url: req.url,
                cookies: req.cookies,
                headers: req.headers
            }, {}, pathname, query, Object.assign(renderOpts, {
                disableOptimizedLoading: true,
                runtime: "experimental-edge"
            }), !!pagesRenderToHTML);
        } else {
            throw new Error(`Invariant: curRenderToHTML is missing`);
        }
    }
    async sendRenderResult(_req, res, options) {
        res.setHeader("X-Edge-Runtime", "1");
        // Add necessary headers.
        // @TODO: Share the isomorphic logic with server/send-payload.ts.
        if (options.poweredByHeader && options.type === "html") {
            res.setHeader("X-Powered-By", "Next.js");
        }
        const resultContentType = options.result.contentType();
        if (!res.getHeader("Content-Type")) {
            res.setHeader("Content-Type", resultContentType ? resultContentType : options.type === "json" ? "application/json" : "text/html; charset=utf-8");
        }
        if (options.result.isDynamic()) {
            const writer = res.transformStream.writable.getWriter();
            options.result.pipe({
                write: (chunk)=>writer.write(chunk),
                end: ()=>writer.close(),
                destroy: (err)=>writer.abort(err),
                cork: ()=>{},
                uncork: ()=>{}
            });
        } else {
            const payload = await options.result.toUnchunkedString();
            res.setHeader("Content-Length", String((0, _web).byteLength(payload)));
            if (options.generateEtags) {
                res.setHeader("ETag", (0, _etag).generateETag(payload));
            }
            res.body(payload);
        }
        res.send();
    }
    async runApi() {
        // @TODO
        return true;
    }
    async findPageComponents({ pathname , query , params  }) {
        const result = await this.serverOptions.webServerConfig.loadComponent(pathname);
        if (!result) return null;
        return {
            query: {
                ...query || {},
                ...params || {}
            },
            components: result
        };
    }
}
exports.default = NextWebServer;
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache() {
    if (typeof WeakMap !== "function") return null;
    var cache = new WeakMap();
    _getRequireWildcardCache = function() {
        return cache;
    };
    return cache;
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache();
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}

//# sourceMappingURL=web-server.js.map