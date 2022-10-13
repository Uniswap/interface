"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
require("./node-polyfill-fetch");
require("./node-polyfill-web-streams");
var _utils = require("../shared/lib/utils");
var _fs = _interopRequireDefault(require("fs"));
var _path = require("path");
var _http = require("http");
var _requestMeta = require("./request-meta");
var _utils1 = require("../shared/lib/router/utils");
var _constants = require("../shared/lib/constants");
var _recursiveReaddirSync = require("./lib/recursive-readdir-sync");
var _url = require("url");
var _compression = _interopRequireDefault(require("next/dist/compiled/compression"));
var _httpProxy = _interopRequireDefault(require("next/dist/compiled/http-proxy"));
var _pathMatch = require("../shared/lib/router/utils/path-match");
var _serverRouteUtils = require("./server-route-utils");
var _getRouteFromAssetPath = _interopRequireDefault(require("../shared/lib/router/utils/get-route-from-asset-path"));
var _sandbox = require("./web/sandbox");
var _detectDomainLocale = require("../shared/lib/i18n/detect-domain-locale");
var _node = require("./base-http/node");
var _sendPayload = require("./send-payload");
var _serveStatic = require("./serve-static");
var _node1 = require("./api-utils/node");
var _render = require("./render");
var _appRender = require("./app-render");
var _parseUrl = require("../shared/lib/router/utils/parse-url");
var Log = _interopRequireWildcard(require("../build/output/log"));
var _requireHook = _interopRequireDefault(require("../build/webpack/require-hook"));
var _baseServer = _interopRequireWildcard(require("./base-server"));
Object.keys(_baseServer).forEach(function(key) {
    if (key === "default" || key === "__esModule") return;
    if (key in exports && exports[key] === _baseServer[key]) return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
            return _baseServer[key];
        }
    });
});
var _require = require("./require");
var _denormalizePagePath = require("../shared/lib/page-path/denormalize-page-path");
var _normalizePagePath = require("../shared/lib/page-path/normalize-page-path");
var _loadComponents = require("./load-components");
var _isError = _interopRequireWildcard(require("../lib/is-error"));
var _utils2 = require("./web/utils");
var _relativizeUrl = require("../shared/lib/router/utils/relativize-url");
var _prepareDestination = require("../shared/lib/router/utils/prepare-destination");
var _normalizeLocalePath = require("../shared/lib/i18n/normalize-locale-path");
var _routeMatcher = require("../shared/lib/router/utils/route-matcher");
var _middlewareRouteMatcher = require("../shared/lib/router/utils/middleware-route-matcher");
var _env = require("@next/env");
var _querystring = require("../shared/lib/router/utils/querystring");
var _removeTrailingSlash = require("../shared/lib/router/utils/remove-trailing-slash");
var _getNextPathnameInfo = require("../shared/lib/router/utils/get-next-pathname-info");
var _bodyStreams = require("./body-streams");
var _apiUtils = require("./api-utils");
var _utils3 = require("./utils");
var _responseCache = _interopRequireDefault(require("./response-cache"));
var _incrementalCache = require("./lib/incremental-cache");
var _utils4 = require("../build/webpack/loaders/next-serverless-loader/utils");
var _routeRegex = require("../shared/lib/router/utils/route-regex");
var _appPaths = require("../shared/lib/router/utils/app-paths");
class NextNodeServer extends _baseServer.default {
    constructor(options){
        // Initialize super class
        super(options);
        /**
     * This sets environment variable to be used at the time of SSR by head.tsx.
     * Using this from process.env allows targeting both serverless and SSR by calling
     * `process.env.__NEXT_OPTIMIZE_CSS`.
     */ if (this.renderOpts.optimizeFonts) {
            process.env.__NEXT_OPTIMIZE_FONTS = JSON.stringify(this.renderOpts.optimizeFonts);
        }
        if (this.renderOpts.optimizeCss) {
            process.env.__NEXT_OPTIMIZE_CSS = JSON.stringify(true);
        }
        if (this.renderOpts.nextScriptWorkers) {
            process.env.__NEXT_SCRIPT_WORKERS = JSON.stringify(true);
        }
        if (!this.minimalMode) {
            const { ImageOptimizerCache  } = require("./image-optimizer");
            this.imageResponseCache = new _responseCache.default(new ImageOptimizerCache({
                distDir: this.distDir,
                nextConfig: this.nextConfig
            }), this.minimalMode);
        }
        if (!options.dev) {
            // pre-warm _document and _app as these will be
            // needed for most requests
            (0, _loadComponents).loadComponents({
                distDir: this.distDir,
                pathname: "/_document",
                serverless: this._isLikeServerless,
                hasServerComponents: false,
                isAppPath: false
            }).catch(()=>{});
            (0, _loadComponents).loadComponents({
                distDir: this.distDir,
                pathname: "/_app",
                serverless: this._isLikeServerless,
                hasServerComponents: false,
                isAppPath: false
            }).catch(()=>{});
        }
    }
    compression = this.nextConfig.compress && this.nextConfig.target === "server" ? (0, _compression).default() : undefined;
    loadEnvConfig({ dev , forceReload  }) {
        (0, _env).loadEnvConfig(this.dir, dev, Log, forceReload);
    }
    getResponseCache({ dev  }) {
        var ref;
        const incrementalCache = new _incrementalCache.IncrementalCache({
            fs: this.getCacheFilesystem(),
            dev,
            serverDistDir: this.serverDistDir,
            appDir: this.nextConfig.experimental.appDir,
            maxMemoryCacheSize: this.nextConfig.experimental.isrMemoryCacheSize,
            flushToDisk: !this.minimalMode && this.nextConfig.experimental.isrFlushToDisk,
            incrementalCacheHandlerPath: (ref = this.nextConfig.experimental) == null ? void 0 : ref.incrementalCacheHandlerPath,
            getPrerenderManifest: ()=>{
                if (dev) {
                    return {
                        version: -1,
                        routes: {},
                        dynamicRoutes: {},
                        notFoundRoutes: [],
                        preview: null
                    };
                } else {
                    return this.getPrerenderManifest();
                }
            }
        });
        return new _responseCache.default(incrementalCache, this.minimalMode);
    }
    getPublicDir() {
        return (0, _path).join(this.dir, _constants.CLIENT_PUBLIC_FILES_PATH);
    }
    getHasStaticDir() {
        return _fs.default.existsSync((0, _path).join(this.dir, "static"));
    }
    getPagesManifest() {
        return require((0, _path).join(this.serverDistDir, _constants.PAGES_MANIFEST));
    }
    getAppPathsManifest() {
        if (this.nextConfig.experimental.appDir) {
            const appPathsManifestPath = (0, _path).join(this.serverDistDir, _constants.APP_PATHS_MANIFEST);
            return require(appPathsManifestPath);
        }
    }
    async hasPage(pathname) {
        let found = false;
        try {
            var ref;
            found = !!this.getPagePath(pathname, (ref = this.nextConfig.i18n) == null ? void 0 : ref.locales);
        } catch (_) {}
        return found;
    }
    getBuildId() {
        const buildIdFile = (0, _path).join(this.distDir, _constants.BUILD_ID_FILE);
        try {
            return _fs.default.readFileSync(buildIdFile, "utf8").trim();
        } catch (err) {
            if (!_fs.default.existsSync(buildIdFile)) {
                throw new Error(`Could not find a production build in the '${this.distDir}' directory. Try building your app with 'next build' before starting the production server. https://nextjs.org/docs/messages/production-start-no-build-id`);
            }
            throw err;
        }
    }
    getCustomRoutes() {
        const customRoutes = this.getRoutesManifest();
        let rewrites;
        // rewrites can be stored as an array when an array is
        // returned in next.config.js so massage them into
        // the expected object format
        if (Array.isArray(customRoutes.rewrites)) {
            rewrites = {
                beforeFiles: [],
                afterFiles: customRoutes.rewrites,
                fallback: []
            };
        } else {
            rewrites = customRoutes.rewrites;
        }
        return Object.assign(customRoutes, {
            rewrites
        });
    }
    generateImageRoutes() {
        return [
            {
                match: (0, _pathMatch).getPathMatch("/_next/image"),
                type: "route",
                name: "_next/image catchall",
                fn: async (req, res, _params, parsedUrl)=>{
                    if (this.minimalMode) {
                        res.statusCode = 400;
                        res.body("Bad Request").send();
                        return {
                            finished: true
                        };
                    }
                    const { getHash , ImageOptimizerCache , sendResponse , ImageError  } = require("./image-optimizer");
                    if (!this.imageResponseCache) {
                        throw new Error("invariant image optimizer cache was not initialized");
                    }
                    const imagesConfig = this.nextConfig.images;
                    if (imagesConfig.loader !== "default") {
                        await this.render404(req, res);
                        return {
                            finished: true
                        };
                    }
                    const paramsResult = ImageOptimizerCache.validateParams(req.originalRequest, parsedUrl.query, this.nextConfig, !!this.renderOpts.dev);
                    if ("errorMessage" in paramsResult) {
                        res.statusCode = 400;
                        res.body(paramsResult.errorMessage).send();
                        return {
                            finished: true
                        };
                    }
                    const cacheKey = ImageOptimizerCache.getCacheKey(paramsResult);
                    try {
                        var ref;
                        const cacheEntry = await this.imageResponseCache.get(cacheKey, async ()=>{
                            const { buffer , contentType , maxAge  } = await this.imageOptimizer(req, res, paramsResult);
                            const etag = getHash([
                                buffer
                            ]);
                            return {
                                value: {
                                    kind: "IMAGE",
                                    buffer,
                                    etag,
                                    extension: (0, _serveStatic).getExtension(contentType)
                                },
                                revalidate: maxAge
                            };
                        }, {});
                        if ((cacheEntry == null ? void 0 : (ref = cacheEntry.value) == null ? void 0 : ref.kind) !== "IMAGE") {
                            throw new Error("invariant did not get entry from image response cache");
                        }
                        sendResponse(req.originalRequest, res.originalResponse, paramsResult.href, cacheEntry.value.extension, cacheEntry.value.buffer, paramsResult.isStatic, cacheEntry.isMiss ? "MISS" : cacheEntry.isStale ? "STALE" : "HIT", imagesConfig.contentSecurityPolicy, cacheEntry.revalidate || 0, Boolean(this.renderOpts.dev));
                    } catch (err) {
                        if (err instanceof ImageError) {
                            res.statusCode = err.statusCode;
                            res.body(err.message).send();
                            return {
                                finished: true
                            };
                        }
                        throw err;
                    }
                    return {
                        finished: true
                    };
                }
            }, 
        ];
    }
    generateStaticRoutes() {
        return this.hasStaticDir ? [
            {
                // It's very important to keep this route's param optional.
                // (but it should support as many params as needed, separated by '/')
                // Otherwise this will lead to a pretty simple DOS attack.
                // See more: https://github.com/vercel/next.js/issues/2617
                match: (0, _pathMatch).getPathMatch("/static/:path*"),
                name: "static catchall",
                fn: async (req, res, params, parsedUrl)=>{
                    const p = (0, _path).join(this.dir, "static", ...params.path);
                    await this.serveStatic(req, res, p, parsedUrl);
                    return {
                        finished: true
                    };
                }
            }, 
        ] : [];
    }
    setImmutableAssetCacheControl(res) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    generateFsStaticRoutes() {
        return [
            {
                match: (0, _pathMatch).getPathMatch("/_next/static/:path*"),
                type: "route",
                name: "_next/static catchall",
                fn: async (req, res, params, parsedUrl)=>{
                    // make sure to 404 for /_next/static itself
                    if (!params.path) {
                        await this.render404(req, res, parsedUrl);
                        return {
                            finished: true
                        };
                    }
                    if (params.path[0] === _constants.CLIENT_STATIC_FILES_RUNTIME || params.path[0] === "chunks" || params.path[0] === "css" || params.path[0] === "image" || params.path[0] === "media" || params.path[0] === this.buildId || params.path[0] === "pages" || params.path[1] === "pages") {
                        this.setImmutableAssetCacheControl(res);
                    }
                    const p = (0, _path).join(this.distDir, _constants.CLIENT_STATIC_FILES_PATH, ...params.path || []);
                    await this.serveStatic(req, res, p, parsedUrl);
                    return {
                        finished: true
                    };
                }
            }, 
        ];
    }
    generatePublicRoutes() {
        if (!_fs.default.existsSync(this.publicDir)) return [];
        const publicFiles = new Set((0, _recursiveReaddirSync).recursiveReadDirSync(this.publicDir).map((p)=>encodeURI(p.replace(/\\/g, "/"))));
        return [
            {
                match: (0, _pathMatch).getPathMatch("/:path*"),
                matchesBasePath: true,
                name: "public folder catchall",
                fn: async (req, res, params, parsedUrl)=>{
                    const pathParts = params.path || [];
                    const { basePath  } = this.nextConfig;
                    // if basePath is defined require it be present
                    if (basePath) {
                        const basePathParts = basePath.split("/");
                        // remove first empty value
                        basePathParts.shift();
                        if (!basePathParts.every((part, idx)=>{
                            return part === pathParts[idx];
                        })) {
                            return {
                                finished: false
                            };
                        }
                        pathParts.splice(0, basePathParts.length);
                    }
                    let path = `/${pathParts.join("/")}`;
                    if (!publicFiles.has(path)) {
                        // In `next-dev-server.ts`, we ensure encoded paths match
                        // decoded paths on the filesystem. So we need do the
                        // opposite here: make sure decoded paths match encoded.
                        path = encodeURI(path);
                    }
                    if (publicFiles.has(path)) {
                        await this.serveStatic(req, res, (0, _path).join(this.publicDir, ...pathParts), parsedUrl);
                        return {
                            finished: true
                        };
                    }
                    return {
                        finished: false
                    };
                }
            }, 
        ];
    }
    _validFilesystemPathSet = null;
    getFilesystemPaths() {
        if (this._validFilesystemPathSet) {
            return this._validFilesystemPathSet;
        }
        const pathUserFilesStatic = (0, _path).join(this.dir, "static");
        let userFilesStatic = [];
        if (this.hasStaticDir && _fs.default.existsSync(pathUserFilesStatic)) {
            userFilesStatic = (0, _recursiveReaddirSync).recursiveReadDirSync(pathUserFilesStatic).map((f)=>(0, _path).join(".", "static", f));
        }
        let userFilesPublic = [];
        if (this.publicDir && _fs.default.existsSync(this.publicDir)) {
            userFilesPublic = (0, _recursiveReaddirSync).recursiveReadDirSync(this.publicDir).map((f)=>(0, _path).join(".", "public", f));
        }
        let nextFilesStatic = [];
        nextFilesStatic = !this.minimalMode && _fs.default.existsSync((0, _path).join(this.distDir, "static")) ? (0, _recursiveReaddirSync).recursiveReadDirSync((0, _path).join(this.distDir, "static")).map((f)=>(0, _path).join(".", (0, _path).relative(this.dir, this.distDir), "static", f)) : [];
        return this._validFilesystemPathSet = new Set([
            ...nextFilesStatic,
            ...userFilesPublic,
            ...userFilesStatic, 
        ]);
    }
    sendRenderResult(req, res, options) {
        return (0, _sendPayload).sendRenderResult({
            req: req.originalRequest,
            res: res.originalResponse,
            ...options
        });
    }
    sendStatic(req, res, path) {
        return (0, _serveStatic).serveStatic(req.originalRequest, res.originalResponse, path);
    }
    handleCompression(req, res) {
        if (this.compression) {
            this.compression(req.originalRequest, res.originalResponse, ()=>{});
        }
    }
    async handleUpgrade(req, socket, head) {
        await this.router.execute(req, socket, (0, _url).parse(req.url, true), head);
    }
    async proxyRequest(req, res, parsedUrl, upgradeHead) {
        const { query  } = parsedUrl;
        delete parsedUrl.query;
        parsedUrl.search = (0, _serverRouteUtils).stringifyQuery(req, query);
        const target = (0, _url).format(parsedUrl);
        const proxy = new _httpProxy.default({
            target,
            changeOrigin: true,
            ignorePath: true,
            xfwd: true,
            ws: true,
            // we limit proxy requests to 30s by default, in development
            // we don't time out WebSocket requests to allow proxying
            proxyTimeout: upgradeHead && this.renderOpts.dev ? undefined : this.nextConfig.experimental.proxyTimeout || 30000
        });
        await new Promise((proxyResolve, proxyReject)=>{
            let finished = false;
            proxy.on("error", (err)=>{
                console.error(`Failed to proxy ${target}`, err);
                if (!finished) {
                    finished = true;
                    proxyReject(err);
                }
            });
            // if upgrade head is present treat as WebSocket request
            if (upgradeHead) {
                proxy.on("proxyReqWs", (proxyReq)=>{
                    proxyReq.on("close", ()=>{
                        if (!finished) {
                            finished = true;
                            proxyResolve(true);
                        }
                    });
                });
                proxy.ws(req, res, upgradeHead);
                proxyResolve(true);
            } else {
                proxy.on("proxyReq", (proxyReq)=>{
                    proxyReq.on("close", ()=>{
                        if (!finished) {
                            finished = true;
                            proxyResolve(true);
                        }
                    });
                });
                proxy.web(req.originalRequest, res.originalResponse);
            }
        });
        return {
            finished: true
        };
    }
    async runApi(req, res, query, params, page, builtPagePath) {
        const edgeFunctions = this.getEdgeFunctions();
        for (const item of edgeFunctions){
            if (item.page === page) {
                const handledAsEdgeFunction = await this.runEdgeFunction({
                    req,
                    res,
                    query,
                    params,
                    page,
                    appPaths: null
                });
                if (handledAsEdgeFunction) {
                    return true;
                }
            }
        }
        const pageModule = await require(builtPagePath);
        query = {
            ...query,
            ...params
        };
        delete query.__nextLocale;
        delete query.__nextDefaultLocale;
        if (!this.renderOpts.dev && this._isLikeServerless) {
            if (typeof pageModule.default === "function") {
                (0, _baseServer).prepareServerlessUrl(req, query);
                await pageModule.default(req, res);
                return true;
            }
        }
        await (0, _node1).apiResolver(req.originalRequest, res.originalResponse, query, pageModule, {
            ...this.renderOpts.previewProps,
            revalidate: (newReq, newRes)=>this.getRequestHandler()(new _node.NodeNextRequest(newReq), new _node.NodeNextResponse(newRes)),
            // internal config so is not typed
            trustHostHeader: this.nextConfig.experimental.trustHostHeader
        }, this.minimalMode, this.renderOpts.dev, page);
        return true;
    }
    async renderHTML(req, res, pathname, query, renderOpts) {
        // Due to the way we pass data by mutating `renderOpts`, we can't extend the
        // object here but only updating its `serverComponentManifest` field.
        // https://github.com/vercel/next.js/blob/df7cbd904c3bd85f399d1ce90680c0ecf92d2752/packages/next/server/render.tsx#L947-L952
        renderOpts.serverComponentManifest = this.serverComponentManifest;
        renderOpts.serverCSSManifest = this.serverCSSManifest;
        if (this.nextConfig.experimental.appDir && (renderOpts.isAppPath || query.__flight__)) {
            const isPagesDir = !renderOpts.isAppPath;
            return (0, _appRender).renderToHTMLOrFlight(req.originalRequest, res.originalResponse, pathname, query, renderOpts, isPagesDir);
        }
        return (0, _render).renderToHTML(req.originalRequest, res.originalResponse, pathname, query, renderOpts);
    }
    streamResponseChunk(res, chunk) {
        res.originalResponse.write(chunk);
        // When both compression and streaming are enabled, we need to explicitly
        // flush the response to avoid it being buffered by gzip.
        if (this.compression && "flush" in res.originalResponse) {
            res.originalResponse.flush();
        }
    }
    async imageOptimizer(req, res, paramsResult) {
        const { imageOptimizer  } = require("./image-optimizer");
        return imageOptimizer(req.originalRequest, res.originalResponse, paramsResult, this.nextConfig, this.renderOpts.dev, (newReq, newRes, newParsedUrl)=>this.getRequestHandler()(new _node.NodeNextRequest(newReq), new _node.NodeNextResponse(newRes), newParsedUrl));
    }
    getPagePath(pathname, locales) {
        return (0, _require).getPagePath(pathname, this.distDir, this._isLikeServerless, this.renderOpts.dev, locales, this.nextConfig.experimental.appDir);
    }
    async renderPageComponent(ctx, bubbleNoFallback) {
        const edgeFunctions = this.getEdgeFunctions() || [];
        if (edgeFunctions.length) {
            const appPaths = this.getOriginalAppPaths(ctx.pathname);
            const isAppPath = Array.isArray(appPaths);
            let page = ctx.pathname;
            if (isAppPath) {
                // When it's an array, we need to pass all parallel routes to the loader.
                page = appPaths[0];
            }
            for (const item of edgeFunctions){
                if (item.page === page) {
                    await this.runEdgeFunction({
                        req: ctx.req,
                        res: ctx.res,
                        query: ctx.query,
                        params: ctx.renderOpts.params,
                        page,
                        appPaths
                    });
                    return null;
                }
            }
        }
        return super.renderPageComponent(ctx, bubbleNoFallback);
    }
    async findPageComponents({ pathname , query , params , isAppPath  }) {
        const paths = [
            pathname
        ];
        if (query.amp) {
            // try serving a static AMP version first
            paths.unshift((isAppPath ? (0, _appPaths).normalizeAppPath(pathname) : (0, _normalizePagePath).normalizePagePath(pathname)) + ".amp");
        }
        if (query.__nextLocale) {
            paths.unshift(...paths.map((path)=>`/${query.__nextLocale}${path === "/" ? "" : path}`));
        }
        for (const pagePath of paths){
            try {
                const components = await (0, _loadComponents).loadComponents({
                    distDir: this.distDir,
                    pathname: pagePath,
                    serverless: !this.renderOpts.dev && this._isLikeServerless,
                    hasServerComponents: !!this.renderOpts.serverComponents,
                    isAppPath
                });
                if (query.__nextLocale && typeof components.Component === "string" && !pagePath.startsWith(`/${query.__nextLocale}`)) {
                    continue;
                }
                return {
                    components,
                    query: {
                        ...components.getStaticProps ? {
                            amp: query.amp,
                            __nextDataReq: query.__nextDataReq,
                            __nextLocale: query.__nextLocale,
                            __nextDefaultLocale: query.__nextDefaultLocale,
                            __flight__: query.__flight__
                        } : query,
                        // For appDir params is excluded.
                        ...(isAppPath ? {} : params) || {}
                    }
                };
            } catch (err) {
                // we should only not throw if we failed to find the page
                // in the pages-manifest
                if (!(err instanceof _utils.PageNotFoundError)) {
                    throw err;
                }
            }
        }
        return null;
    }
    getFontManifest() {
        return (0, _require).requireFontManifest(this.distDir, this._isLikeServerless);
    }
    getServerComponentManifest() {
        if (!this.nextConfig.experimental.serverComponents) return undefined;
        return require((0, _path).join(this.distDir, "server", _constants.FLIGHT_MANIFEST + ".json"));
    }
    getServerCSSManifest() {
        if (!this.nextConfig.experimental.serverComponents) return undefined;
        return require((0, _path).join(this.distDir, "server", _constants.FLIGHT_SERVER_CSS_MANIFEST + ".json"));
    }
    getFallback(page) {
        page = (0, _normalizePagePath).normalizePagePath(page);
        const cacheFs = this.getCacheFilesystem();
        return cacheFs.readFile((0, _path).join(this.serverDistDir, "pages", `${page}.html`));
    }
    generateRoutes() {
        const publicRoutes = this.generatePublicRoutes();
        const imageRoutes = this.generateImageRoutes();
        const staticFilesRoutes = this.generateStaticRoutes();
        const fsRoutes = [
            ...this.generateFsStaticRoutes(),
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
            ...imageRoutes,
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
            ...publicRoutes,
            ...staticFilesRoutes, 
        ];
        const restrictedRedirectPaths = this.nextConfig.basePath ? [
            `${this.nextConfig.basePath}/_next`
        ] : [
            "/_next"
        ];
        // Headers come very first
        const headers = this.minimalMode ? [] : this.customRoutes.headers.map((rule)=>(0, _serverRouteUtils).createHeaderRoute({
                rule,
                restrictedRedirectPaths
            }));
        const redirects = this.minimalMode ? [] : this.customRoutes.redirects.map((rule)=>(0, _serverRouteUtils).createRedirectRoute({
                rule,
                restrictedRedirectPaths
            }));
        const rewrites = this.generateRewrites({
            restrictedRedirectPaths
        });
        const catchAllMiddleware = this.generateCatchAllMiddlewareRoute();
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
                    const handled = await this.handleApiRequest(req, res, pathname, query);
                    if (handled) {
                        return {
                            finished: true
                        };
                    }
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
            headers,
            fsRoutes,
            rewrites,
            redirects,
            catchAllRoute,
            catchAllMiddleware,
            useFileSystemPublicRoutes,
            dynamicRoutes: this.dynamicRoutes,
            pageChecker: this.hasPage.bind(this),
            nextConfig: this.nextConfig
        };
    }
    // Used to build API page in development
    async ensureApiPage(_pathname) {}
    /**
   * Resolves `API` request, in development builds on demand
   * @param req http request
   * @param res http response
   * @param pathname path of request
   */ async handleApiRequest(req, res, pathname, query) {
        let page = pathname;
        let params = undefined;
        let pageFound = !(0, _utils1).isDynamicRoute(page) && await this.hasPage(page);
        if (!pageFound && this.dynamicRoutes) {
            for (const dynamicRoute of this.dynamicRoutes){
                params = dynamicRoute.match(pathname) || undefined;
                if (dynamicRoute.page.startsWith("/api") && params) {
                    page = dynamicRoute.page;
                    pageFound = true;
                    break;
                }
            }
        }
        if (!pageFound) {
            return false;
        }
        // Make sure the page is built before getting the path
        // or else it won't be in the manifest yet
        await this.ensureApiPage(page);
        let builtPagePath;
        try {
            builtPagePath = this.getPagePath(page);
        } catch (err) {
            if ((0, _isError).default(err) && err.code === "ENOENT") {
                return false;
            }
            throw err;
        }
        return this.runApi(req, res, query, params, page, builtPagePath);
    }
    getCacheFilesystem() {
        return {
            readFile: (f)=>_fs.default.promises.readFile(f, "utf8"),
            readFileSync: (f)=>_fs.default.readFileSync(f, "utf8"),
            writeFile: (f, d)=>_fs.default.promises.writeFile(f, d, "utf8"),
            mkdir: (dir)=>_fs.default.promises.mkdir(dir, {
                    recursive: true
                }),
            stat: (f)=>_fs.default.promises.stat(f)
        };
    }
    normalizeReq(req) {
        return req instanceof _http.IncomingMessage ? new _node.NodeNextRequest(req) : req;
    }
    normalizeRes(res) {
        return res instanceof _http.ServerResponse ? new _node.NodeNextResponse(res) : res;
    }
    getRequestHandler() {
        const handler = super.getRequestHandler();
        return async (req, res, parsedUrl)=>{
            return handler(this.normalizeReq(req), this.normalizeRes(res), parsedUrl);
        };
    }
    async render(req, res, pathname, query, parsedUrl, internal = false) {
        return super.render(this.normalizeReq(req), this.normalizeRes(res), pathname, query, parsedUrl, internal);
    }
    async renderToHTML(req, res, pathname, query) {
        return super.renderToHTML(this.normalizeReq(req), this.normalizeRes(res), pathname, query);
    }
    async renderError(err, req, res, pathname, query, setHeaders) {
        return super.renderError(err, this.normalizeReq(req), this.normalizeRes(res), pathname, query, setHeaders);
    }
    async renderErrorToHTML(err, req, res, pathname, query) {
        return super.renderErrorToHTML(err, this.normalizeReq(req), this.normalizeRes(res), pathname, query);
    }
    async render404(req, res, parsedUrl, setHeaders) {
        return super.render404(this.normalizeReq(req), this.normalizeRes(res), parsedUrl, setHeaders);
    }
    async serveStatic(req, res, path, parsedUrl) {
        if (!this.isServeableUrl(path)) {
            return this.render404(req, res, parsedUrl);
        }
        if (!(req.method === "GET" || req.method === "HEAD")) {
            res.statusCode = 405;
            res.setHeader("Allow", [
                "GET",
                "HEAD"
            ]);
            return this.renderError(null, req, res, path);
        }
        try {
            await this.sendStatic(req, res, path);
        } catch (error) {
            if (!(0, _isError).default(error)) throw error;
            const err = error;
            if (err.code === "ENOENT" || err.statusCode === 404) {
                this.render404(req, res, parsedUrl);
            } else if (typeof err.statusCode === "number" && POSSIBLE_ERROR_CODE_FROM_SERVE_STATIC.has(err.statusCode)) {
                res.statusCode = err.statusCode;
                return this.renderError(err, req, res, path);
            } else {
                throw err;
            }
        }
    }
    getStaticRoutes() {
        return this.hasStaticDir ? [
            {
                // It's very important to keep this route's param optional.
                // (but it should support as many params as needed, separated by '/')
                // Otherwise this will lead to a pretty simple DOS attack.
                // See more: https://github.com/vercel/next.js/issues/2617
                match: (0, _pathMatch).getPathMatch("/static/:path*"),
                name: "static catchall",
                fn: async (req, res, params, parsedUrl)=>{
                    const p = (0, _path).join(this.dir, "static", ...params.path);
                    await this.serveStatic(req, res, p, parsedUrl);
                    return {
                        finished: true
                    };
                }
            }, 
        ] : [];
    }
    isServeableUrl(untrustedFileUrl) {
        // This method mimics what the version of `send` we use does:
        // 1. decodeURIComponent:
        //    https://github.com/pillarjs/send/blob/0.17.1/index.js#L989
        //    https://github.com/pillarjs/send/blob/0.17.1/index.js#L518-L522
        // 2. resolve:
        //    https://github.com/pillarjs/send/blob/de073ed3237ade9ff71c61673a34474b30e5d45b/index.js#L561
        let decodedUntrustedFilePath;
        try {
            // (1) Decode the URL so we have the proper file name
            decodedUntrustedFilePath = decodeURIComponent(untrustedFileUrl);
        } catch  {
            return false;
        }
        // (2) Resolve "up paths" to determine real request
        const untrustedFilePath = (0, _path).resolve(decodedUntrustedFilePath);
        // don't allow null bytes anywhere in the file path
        if (untrustedFilePath.indexOf("\0") !== -1) {
            return false;
        }
        // Check if .next/static, static and public are in the path.
        // If not the path is not available.
        if ((untrustedFilePath.startsWith((0, _path).join(this.distDir, "static") + _path.sep) || untrustedFilePath.startsWith((0, _path).join(this.dir, "static") + _path.sep) || untrustedFilePath.startsWith((0, _path).join(this.dir, "public") + _path.sep)) === false) {
            return false;
        }
        // Check against the real filesystem paths
        const filesystemUrls = this.getFilesystemPaths();
        const resolved = (0, _path).relative(this.dir, untrustedFilePath);
        return filesystemUrls.has(resolved);
    }
    generateRewrites({ restrictedRedirectPaths  }) {
        let beforeFiles = [];
        let afterFiles = [];
        let fallback = [];
        if (!this.minimalMode) {
            const buildRewrite = (rewrite, check = true)=>{
                const rewriteRoute = (0, _serverRouteUtils).getCustomRoute({
                    type: "rewrite",
                    rule: rewrite,
                    restrictedRedirectPaths
                });
                return {
                    ...rewriteRoute,
                    check,
                    type: rewriteRoute.type,
                    name: `Rewrite route ${rewriteRoute.source}`,
                    match: rewriteRoute.match,
                    matchesBasePath: true,
                    matchesLocale: true,
                    matchesLocaleAPIRoutes: true,
                    matchesTrailingSlash: true,
                    fn: async (req, res, params, parsedUrl, upgradeHead)=>{
                        const { newUrl , parsedDestination  } = (0, _prepareDestination).prepareDestination({
                            appendParamsToQuery: true,
                            destination: rewriteRoute.destination,
                            params: params,
                            query: parsedUrl.query
                        });
                        // external rewrite, proxy it
                        if (parsedDestination.protocol) {
                            return this.proxyRequest(req, res, parsedDestination, upgradeHead);
                        }
                        (0, _requestMeta).addRequestMeta(req, "_nextRewroteUrl", newUrl);
                        (0, _requestMeta).addRequestMeta(req, "_nextDidRewrite", newUrl !== req.url);
                        return {
                            finished: false,
                            pathname: newUrl,
                            query: parsedDestination.query
                        };
                    }
                };
            };
            if (Array.isArray(this.customRoutes.rewrites)) {
                afterFiles = this.customRoutes.rewrites.map((r)=>buildRewrite(r));
            } else {
                beforeFiles = this.customRoutes.rewrites.beforeFiles.map((r)=>buildRewrite(r, false));
                afterFiles = this.customRoutes.rewrites.afterFiles.map((r)=>buildRewrite(r));
                fallback = this.customRoutes.rewrites.fallback.map((r)=>buildRewrite(r));
            }
        }
        return {
            beforeFiles,
            afterFiles,
            fallback
        };
    }
    getMiddlewareManifest() {
        if (this.minimalMode) return null;
        const manifest = require((0, _path).join(this.serverDistDir, _constants.MIDDLEWARE_MANIFEST));
        return manifest;
    }
    /** Returns the middleware routing item if there is one. */ getMiddleware() {
        var ref;
        const manifest = this.getMiddlewareManifest();
        const middleware = manifest == null ? void 0 : (ref = manifest.middleware) == null ? void 0 : ref["/"];
        if (!middleware) {
            return;
        }
        return {
            match: getMiddlewareMatcher(middleware),
            page: "/"
        };
    }
    getEdgeFunctions() {
        const manifest = this.getMiddlewareManifest();
        if (!manifest) {
            return [];
        }
        return Object.keys(manifest.functions).map((page)=>({
                match: getEdgeMatcher(manifest.functions[page]),
                page
            }));
    }
    /**
   * Get information for the edge function located in the provided page
   * folder. If the edge function info can't be found it will throw
   * an error.
   */ getEdgeFunctionInfo(params) {
        const manifest = require((0, _path).join(this.serverDistDir, _constants.MIDDLEWARE_MANIFEST));
        let foundPage;
        try {
            foundPage = (0, _denormalizePagePath).denormalizePagePath((0, _normalizePagePath).normalizePagePath(params.page));
        } catch (err) {
            return null;
        }
        let pageInfo = params.middleware ? manifest.middleware[foundPage] : manifest.functions[foundPage];
        if (!pageInfo) {
            if (!params.middleware) {
                throw new _utils.PageNotFoundError(foundPage);
            }
            return null;
        }
        var _env1, _wasm, _assets;
        return {
            name: pageInfo.name,
            paths: pageInfo.files.map((file)=>(0, _path).join(this.distDir, file)),
            env: (_env1 = pageInfo.env) != null ? _env1 : [],
            wasm: ((_wasm = pageInfo.wasm) != null ? _wasm : []).map((binding)=>({
                    ...binding,
                    filePath: (0, _path).join(this.distDir, binding.filePath)
                })),
            assets: ((_assets = pageInfo.assets) != null ? _assets : []).map((binding)=>{
                return {
                    ...binding,
                    filePath: (0, _path).join(this.distDir, binding.filePath)
                };
            })
        };
    }
    /**
   * Checks if a middleware exists. This method is useful for the development
   * server where we need to check the filesystem. Here we just check the
   * middleware manifest.
   */ async hasMiddleware(pathname) {
        const info = this.getEdgeFunctionInfo({
            page: pathname,
            middleware: true
        });
        return Boolean(info && info.paths.length > 0);
    }
    /**
   * A placeholder for a function to be defined in the development server.
   * It will make sure that the root middleware or an edge function has been compiled
   * so that we can run it.
   */ async ensureMiddleware() {}
    async ensureEdgeFunction(_params) {}
    /**
   * This method gets all middleware matchers and execute them when the request
   * matches. It will make sure that each middleware exists and is compiled and
   * ready to be invoked. The development server will decorate it to add warns
   * and errors with rich traces.
   */ async runMiddleware(params) {
        // Middleware is skipped for on-demand revalidate requests
        if ((0, _apiUtils).checkIsManualRevalidate(params.request, this.renderOpts.previewProps).isManualRevalidate) {
            return {
                finished: false
            };
        }
        const normalizedPathname = (0, _removeTrailingSlash).removeTrailingSlash(params.parsed.pathname || "");
        // For middleware to "fetch" we must always provide an absolute URL
        const query = (0, _querystring).urlQueryToSearchParams(params.parsed.query).toString();
        const locale = params.parsed.query.__nextLocale;
        const url = `${(0, _requestMeta).getRequestMeta(params.request, "_protocol")}://${this.hostname}:${this.port}${locale ? `/${locale}` : ""}${params.parsed.pathname}${query ? `?${query}` : ""}`;
        if (!url.startsWith("http")) {
            throw new Error("To use middleware you must provide a `hostname` and `port` to the Next.js Server");
        }
        const page = {};
        if (await this.hasPage(normalizedPathname)) {
            page.name = params.parsedUrl.pathname;
        } else if (this.dynamicRoutes) {
            for (const dynamicRoute of this.dynamicRoutes){
                const matchParams = dynamicRoute.match(normalizedPathname);
                if (matchParams) {
                    page.name = dynamicRoute.page;
                    page.params = matchParams;
                    break;
                }
            }
        }
        const middleware = this.getMiddleware();
        if (!middleware) {
            return {
                finished: false
            };
        }
        if (!await this.hasMiddleware(middleware.page)) {
            return {
                finished: false
            };
        }
        await this.ensureMiddleware();
        const middlewareInfo = this.getEdgeFunctionInfo({
            page: middleware.page,
            middleware: true
        });
        if (!middlewareInfo) {
            throw new _utils.MiddlewareNotFoundError();
        }
        const method = (params.request.method || "GET").toUpperCase();
        const result = await (0, _sandbox).run({
            distDir: this.distDir,
            name: middlewareInfo.name,
            paths: middlewareInfo.paths,
            env: middlewareInfo.env,
            edgeFunctionEntry: middlewareInfo,
            request: {
                headers: params.request.headers,
                method,
                nextConfig: {
                    basePath: this.nextConfig.basePath,
                    i18n: this.nextConfig.i18n,
                    trailingSlash: this.nextConfig.trailingSlash
                },
                url: url,
                page: page,
                body: (0, _requestMeta).getRequestMeta(params.request, "__NEXT_CLONABLE_BODY")
            },
            useCache: !this.nextConfig.experimental.runtime,
            onWarning: params.onWarning
        });
        const allHeaders = new Headers();
        for (let [key, value] of result.response.headers){
            if (key !== "x-middleware-next") {
                allHeaders.append(key, value);
            }
        }
        if (!this.renderOpts.dev) {
            result.waitUntil.catch((error)=>{
                console.error(`Uncaught: middleware waitUntil errored`, error);
            });
        }
        if (!result) {
            this.render404(params.request, params.response, params.parsed);
            return {
                finished: true
            };
        } else {
            for (let [key, value] of allHeaders){
                result.response.headers.set(key, value);
            }
        }
        return result;
    }
    generateCatchAllMiddlewareRoute(devReady) {
        if (this.minimalMode) return [];
        const routes = [];
        if (!this.renderOpts.dev || devReady) {
            if (this.getMiddleware()) {
                const middlewareCatchAllRoute = {
                    match: (0, _pathMatch).getPathMatch("/:path*"),
                    matchesBasePath: true,
                    matchesLocale: true,
                    type: "route",
                    name: "middleware catchall",
                    fn: async (req, res, _params, parsed)=>{
                        const middleware = this.getMiddleware();
                        if (!middleware) {
                            return {
                                finished: false
                            };
                        }
                        const initUrl = (0, _requestMeta).getRequestMeta(req, "__NEXT_INIT_URL");
                        const parsedUrl = (0, _parseUrl).parseUrl(initUrl);
                        const pathnameInfo = (0, _getNextPathnameInfo).getNextPathnameInfo(parsedUrl.pathname, {
                            nextConfig: this.nextConfig
                        });
                        parsedUrl.pathname = pathnameInfo.pathname;
                        const normalizedPathname = (0, _removeTrailingSlash).removeTrailingSlash(parsed.pathname || "");
                        if (!middleware.match(normalizedPathname, req, parsedUrl.query)) {
                            return {
                                finished: false
                            };
                        }
                        let result;
                        try {
                            result = await this.runMiddleware({
                                request: req,
                                response: res,
                                parsedUrl: parsedUrl,
                                parsed: parsed
                            });
                        } catch (err) {
                            if ((0, _isError).default(err) && err.code === "ENOENT") {
                                await this.render404(req, res, parsed);
                                return {
                                    finished: true
                                };
                            }
                            if (err instanceof _utils.DecodeError) {
                                res.statusCode = 400;
                                this.renderError(err, req, res, parsed.pathname || "");
                                return {
                                    finished: true
                                };
                            }
                            const error = (0, _isError).getProperError(err);
                            console.error(error);
                            res.statusCode = 500;
                            this.renderError(error, req, res, parsed.pathname || "");
                            return {
                                finished: true
                            };
                        }
                        if ("finished" in result) {
                            return result;
                        }
                        if (result.response.headers.has("x-middleware-rewrite")) {
                            const value = result.response.headers.get("x-middleware-rewrite");
                            const rel = (0, _relativizeUrl).relativizeURL(value, initUrl);
                            result.response.headers.set("x-middleware-rewrite", rel);
                        }
                        if (result.response.headers.has("Location")) {
                            const value = result.response.headers.get("Location");
                            const rel = (0, _relativizeUrl).relativizeURL(value, initUrl);
                            result.response.headers.set("Location", rel);
                        }
                        if (!result.response.headers.has("x-middleware-rewrite") && !result.response.headers.has("x-middleware-next") && !result.response.headers.has("Location")) {
                            result.response.headers.set("x-middleware-refresh", "1");
                        }
                        result.response.headers.delete("x-middleware-next");
                        for (const [key, value] of Object.entries((0, _utils2).toNodeHeaders(result.response.headers))){
                            if ([
                                "x-middleware-rewrite",
                                "x-middleware-redirect",
                                "x-middleware-refresh", 
                            ].includes(key)) {
                                continue;
                            }
                            if (key !== "content-encoding" && value !== undefined) {
                                res.setHeader(key, value);
                            }
                        }
                        res.statusCode = result.response.status;
                        res.statusMessage = result.response.statusText;
                        const location = result.response.headers.get("Location");
                        if (location) {
                            res.statusCode = result.response.status;
                            if (res.statusCode === 308) {
                                res.setHeader("Refresh", `0;url=${location}`);
                            }
                            res.body(location).send();
                            return {
                                finished: true
                            };
                        }
                        if (result.response.headers.has("x-middleware-rewrite")) {
                            const rewritePath = result.response.headers.get("x-middleware-rewrite");
                            const parsedDestination = (0, _parseUrl).parseUrl(rewritePath);
                            const newUrl = parsedDestination.pathname;
                            if (parsedDestination.protocol && (parsedDestination.port ? `${parsedDestination.hostname}:${parsedDestination.port}` : parsedDestination.hostname) !== req.headers.host) {
                                return this.proxyRequest(req, res, parsedDestination);
                            }
                            if (this.nextConfig.i18n) {
                                const localePathResult = (0, _normalizeLocalePath).normalizeLocalePath(newUrl, this.nextConfig.i18n.locales);
                                if (localePathResult.detectedLocale) {
                                    parsedDestination.query.__nextLocale = localePathResult.detectedLocale;
                                }
                            }
                            (0, _requestMeta).addRequestMeta(req, "_nextRewroteUrl", newUrl);
                            (0, _requestMeta).addRequestMeta(req, "_nextDidRewrite", newUrl !== req.url);
                            return {
                                finished: false,
                                pathname: newUrl,
                                query: parsedDestination.query
                            };
                        }
                        if (result.response.headers.has("x-middleware-refresh")) {
                            res.statusCode = result.response.status;
                            for await (const chunk of result.response.body || []){
                                this.streamResponseChunk(res, chunk);
                            }
                            res.send();
                            return {
                                finished: true
                            };
                        }
                        return {
                            finished: false
                        };
                    }
                };
                routes.push(middlewareCatchAllRoute);
            }
        }
        return routes;
    }
    getPrerenderManifest() {
        if (this._cachedPreviewManifest) {
            return this._cachedPreviewManifest;
        }
        const manifest = require((0, _path).join(this.distDir, _constants.PRERENDER_MANIFEST));
        return this._cachedPreviewManifest = manifest;
    }
    getRoutesManifest() {
        return require((0, _path).join(this.distDir, _constants.ROUTES_MANIFEST));
    }
    attachRequestMeta(req, parsedUrl) {
        var ref, ref1;
        const protocol = ((ref1 = (ref = req.originalRequest) == null ? void 0 : ref.socket) == null ? void 0 : ref1.encrypted) ? "https" : "http";
        // When there are hostname and port we build an absolute URL
        const initUrl = this.hostname && this.port ? `${protocol}://${this.hostname}:${this.port}${req.url}` : req.url;
        (0, _requestMeta).addRequestMeta(req, "__NEXT_INIT_URL", initUrl);
        (0, _requestMeta).addRequestMeta(req, "__NEXT_INIT_QUERY", {
            ...parsedUrl.query
        });
        (0, _requestMeta).addRequestMeta(req, "_protocol", protocol);
        (0, _requestMeta).addRequestMeta(req, "__NEXT_CLONABLE_BODY", (0, _bodyStreams).getClonableBody(req.body));
    }
    async runEdgeFunction(params) {
        let middlewareInfo;
        const { query , page  } = params;
        await this.ensureEdgeFunction({
            page,
            appPaths: params.appPaths
        });
        middlewareInfo = this.getEdgeFunctionInfo({
            page,
            middleware: false
        });
        if (!middlewareInfo) {
            return null;
        }
        // For middleware to "fetch" we must always provide an absolute URL
        const locale = query.__nextLocale;
        const isDataReq = !!query.__nextDataReq;
        const queryString = (0, _querystring).urlQueryToSearchParams(query).toString();
        if (isDataReq) {
            params.req.headers["x-nextjs-data"] = "1";
        }
        let normalizedPathname = (0, _appPaths).normalizeAppPath(page);
        if ((0, _utils1).isDynamicRoute(normalizedPathname)) {
            const routeRegex = (0, _routeRegex).getNamedRouteRegex(normalizedPathname);
            normalizedPathname = (0, _utils4).interpolateDynamicPath(normalizedPathname, Object.assign({}, params.params, query), routeRegex);
        }
        const url = `${(0, _requestMeta).getRequestMeta(params.req, "_protocol")}://${this.hostname}:${this.port}${locale ? `/${locale}` : ""}${normalizedPathname}${queryString ? `?${queryString}` : ""}`;
        if (!url.startsWith("http")) {
            throw new Error("To use middleware you must provide a `hostname` and `port` to the Next.js Server");
        }
        const result = await (0, _sandbox).run({
            distDir: this.distDir,
            name: middlewareInfo.name,
            paths: middlewareInfo.paths,
            env: middlewareInfo.env,
            edgeFunctionEntry: middlewareInfo,
            request: {
                headers: params.req.headers,
                method: params.req.method,
                nextConfig: {
                    basePath: this.nextConfig.basePath,
                    i18n: this.nextConfig.i18n,
                    trailingSlash: this.nextConfig.trailingSlash
                },
                url,
                page: {
                    name: params.page,
                    ...params.params && {
                        params: params.params
                    }
                },
                body: (0, _requestMeta).getRequestMeta(params.req, "__NEXT_CLONABLE_BODY")
            },
            useCache: !this.nextConfig.experimental.runtime,
            onWarning: params.onWarning
        });
        params.res.statusCode = result.response.status;
        params.res.statusMessage = result.response.statusText;
        result.response.headers.forEach((value, key)=>{
            params.res.appendHeader(key, value);
        });
        if (result.response.body) {
            // TODO(gal): not sure that we always need to stream
            (0, _bodyStreams).bodyStreamToNodeStream(result.response.body).pipe(params.res.originalResponse);
        } else {
            params.res.originalResponse.end();
        }
        return result;
    }
    get _isLikeServerless() {
        return (0, _utils3).isTargetLikeServerless(this.nextConfig.target);
    }
    get serverDistDir() {
        return (0, _path).join(this.distDir, this._isLikeServerless ? _constants.SERVERLESS_DIRECTORY : _constants.SERVER_DIRECTORY);
    }
}
exports.default = NextNodeServer;
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
if (_utils3.shouldUseReactRoot) {
    process.env.__NEXT_REACT_ROOT = "true";
}
(0, _requireHook).default();
const MiddlewareMatcherCache = new WeakMap();
const EdgeMatcherCache = new WeakMap();
function getMiddlewareMatcher(info) {
    const stored = MiddlewareMatcherCache.get(info);
    if (stored) {
        return stored;
    }
    if (!Array.isArray(info.matchers)) {
        throw new Error(`Invariant: invalid matchers for middleware ${JSON.stringify(info)}`);
    }
    const matcher = (0, _middlewareRouteMatcher).getMiddlewareRouteMatcher(info.matchers);
    MiddlewareMatcherCache.set(info, matcher);
    return matcher;
}
/**
 * Hardcoded every possible error status code that could be thrown by "serveStatic" method
 * This is done by searching "this.error" inside "send" module's source code:
 * https://github.com/pillarjs/send/blob/master/index.js
 * https://github.com/pillarjs/send/blob/develop/index.js
 */ const POSSIBLE_ERROR_CODE_FROM_SERVE_STATIC = new Set([
    // send module will throw 500 when header is already sent or fs.stat error happens
    // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L392
    // Note: we will use Next.js built-in 500 page to handle 500 errors
    // 500,
    // send module will throw 404 when file is missing
    // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L421
    // Note: we will use Next.js built-in 404 page to handle 404 errors
    // 404,
    // send module will throw 403 when redirecting to a directory without enabling directory listing
    // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L484
    // Note: Next.js throws a different error (without status code) for directory listing
    // 403,
    // send module will throw 400 when fails to normalize the path
    // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L520
    400,
    // send module will throw 412 with conditional GET request
    // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L632
    412,
    // send module will throw 416 when range is not satisfiable
    // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L669
    416, 
]);
function getEdgeMatcher(info) {
    const stored = EdgeMatcherCache.get(info);
    if (stored) {
        return stored;
    }
    if (!Array.isArray(info.matchers) || info.matchers.length !== 1) {
        throw new Error(`Invariant: invalid matchers for middleware ${JSON.stringify(info)}`);
    }
    const matcher = (0, _routeMatcher).getRouteMatcher({
        re: new RegExp(info.matchers[0].regexp),
        groups: {}
    });
    EdgeMatcherCache.set(info, matcher);
    return matcher;
}

//# sourceMappingURL=next-server.js.map