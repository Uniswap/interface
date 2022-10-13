"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.prepareServerlessUrl = prepareServerlessUrl;
exports.default = void 0;
var _utils = require("../shared/lib/utils");
var _querystring = require("querystring");
var _url = require("url");
var _redirectStatus = require("../lib/redirect-status");
var _constants = require("../shared/lib/constants");
var _utils1 = require("../shared/lib/router/utils");
var _apiUtils = require("./api-utils");
var envConfig = _interopRequireWildcard(require("../shared/lib/runtime-config"));
var _router = _interopRequireDefault(require("./router"));
var _revalidateHeaders = require("./send-payload/revalidate-headers");
var _utils2 = require("./utils");
var _isBot = require("../shared/lib/router/utils/is-bot");
var _renderResult = _interopRequireDefault(require("./render-result"));
var _removeTrailingSlash = require("../shared/lib/router/utils/remove-trailing-slash");
var _denormalizePagePath = require("../shared/lib/page-path/denormalize-page-path");
var _normalizeLocalePath = require("../shared/lib/i18n/normalize-locale-path");
var Log = _interopRequireWildcard(require("../build/output/log"));
var _detectDomainLocale = require("../shared/lib/i18n/detect-domain-locale");
var _escapePathDelimiters = _interopRequireDefault(require("../shared/lib/router/utils/escape-path-delimiters"));
var _utils3 = require("../build/webpack/loaders/next-serverless-loader/utils");
var _isError = _interopRequireWildcard(require("../lib/is-error"));
var _requestMeta = require("./request-meta");
var _removePathPrefix = require("../shared/lib/router/utils/remove-path-prefix");
var _appPaths = require("../shared/lib/router/utils/app-paths");
var _routeMatcher = require("../shared/lib/router/utils/route-matcher");
var _routeRegex = require("../shared/lib/router/utils/route-regex");
var _getLocaleRedirect = require("../shared/lib/i18n/get-locale-redirect");
var _getHostname = require("../shared/lib/get-hostname");
var _parseUrl = require("../shared/lib/router/utils/parse-url");
var _getNextPathnameInfo = require("../shared/lib/router/utils/get-next-pathname-info");
class Server {
    constructor(options){
        var ref, ref1;
        const { dir ="." , quiet =false , conf , dev =false , minimalMode =false , customServer =true , hostname , port ,  } = options;
        this.serverOptions = options;
        this.dir = process.env.NEXT_RUNTIME === "edge" ? dir : require("path").resolve(dir);
        this.quiet = quiet;
        this.loadEnvConfig({
            dev
        });
        // TODO: should conf be normalized to prevent missing
        // values from causing issues as this can be user provided
        this.nextConfig = conf;
        this.hostname = hostname;
        this.port = port;
        this.distDir = process.env.NEXT_RUNTIME === "edge" ? this.nextConfig.distDir : require("path").join(this.dir, this.nextConfig.distDir);
        this.publicDir = this.getPublicDir();
        this.hasStaticDir = !minimalMode && this.getHasStaticDir();
        // Only serverRuntimeConfig needs the default
        // publicRuntimeConfig gets it's default in client/index.js
        const { serverRuntimeConfig ={} , publicRuntimeConfig , assetPrefix , generateEtags ,  } = this.nextConfig;
        this.buildId = this.getBuildId();
        this.minimalMode = minimalMode || !!process.env.NEXT_PRIVATE_MINIMAL_MODE;
        const serverComponents = this.nextConfig.experimental.serverComponents;
        this.serverComponentManifest = serverComponents ? this.getServerComponentManifest() : undefined;
        this.serverCSSManifest = serverComponents ? this.getServerCSSManifest() : undefined;
        this.renderOpts = {
            poweredByHeader: this.nextConfig.poweredByHeader,
            canonicalBase: this.nextConfig.amp.canonicalBase || "",
            buildId: this.buildId,
            generateEtags,
            previewProps: this.getPreviewProps(),
            customServer: customServer === true ? true : undefined,
            ampOptimizerConfig: (ref = this.nextConfig.experimental.amp) == null ? void 0 : ref.optimizer,
            basePath: this.nextConfig.basePath,
            images: this.nextConfig.images,
            optimizeFonts: this.nextConfig.optimizeFonts,
            fontManifest: this.nextConfig.optimizeFonts && !dev ? this.getFontManifest() : undefined,
            optimizeCss: this.nextConfig.experimental.optimizeCss,
            nextScriptWorkers: this.nextConfig.experimental.nextScriptWorkers,
            disableOptimizedLoading: this.nextConfig.experimental.runtime ? true : this.nextConfig.experimental.disableOptimizedLoading,
            domainLocales: (ref1 = this.nextConfig.i18n) == null ? void 0 : ref1.domains,
            distDir: this.distDir,
            runtime: this.nextConfig.experimental.runtime,
            serverComponents,
            crossOrigin: this.nextConfig.crossOrigin ? this.nextConfig.crossOrigin : undefined,
            largePageDataBytes: this.nextConfig.experimental.largePageDataBytes
        };
        // Only the `publicRuntimeConfig` key is exposed to the client side
        // It'll be rendered as part of __NEXT_DATA__ on the client side
        if (Object.keys(publicRuntimeConfig).length > 0) {
            this.renderOpts.runtimeConfig = publicRuntimeConfig;
        }
        // Initialize next/config with the environment configuration
        envConfig.setConfig({
            serverRuntimeConfig,
            publicRuntimeConfig
        });
        this.pagesManifest = this.getPagesManifest();
        this.appPathsManifest = this.getAppPathsManifest();
        this.customRoutes = this.getCustomRoutes();
        this.router = new _router.default(this.generateRoutes());
        this.setAssetPrefix(assetPrefix);
        this.responseCache = this.getResponseCache({
            dev
        });
    }
    logError(err) {
        if (this.quiet) return;
        console.error(err);
    }
    async handleRequest(req, res, parsedUrl) {
        try {
            var ref, ref2;
            const urlParts = (req.url || "").split("?");
            const urlNoQuery = urlParts[0];
            // this normalizes repeated slashes in the path e.g. hello//world ->
            // hello/world or backslashes to forward slashes, this does not
            // handle trailing slash as that is handled the same as a next.config.js
            // redirect
            if (urlNoQuery == null ? void 0 : urlNoQuery.match(/(\\|\/\/)/)) {
                const cleanUrl = (0, _utils).normalizeRepeatedSlashes(req.url);
                res.redirect(cleanUrl, 308).body(cleanUrl).send();
                return;
            }
            (0, _apiUtils).setLazyProp({
                req: req
            }, "cookies", (0, _apiUtils).getCookieParser(req.headers));
            // Parse url if parsedUrl not provided
            if (!parsedUrl || typeof parsedUrl !== "object") {
                parsedUrl = (0, _url).parse(req.url, true);
            }
            // Parse the querystring ourselves if the user doesn't handle querystring parsing
            if (typeof parsedUrl.query === "string") {
                parsedUrl.query = (0, _querystring).parse(parsedUrl.query);
            }
            this.attachRequestMeta(req, parsedUrl);
            const domainLocale = (0, _detectDomainLocale).detectDomainLocale((ref = this.nextConfig.i18n) == null ? void 0 : ref.domains, (0, _getHostname).getHostname(parsedUrl, req.headers));
            const defaultLocale = (domainLocale == null ? void 0 : domainLocale.defaultLocale) || ((ref2 = this.nextConfig.i18n) == null ? void 0 : ref2.defaultLocale);
            const url = (0, _parseUrl).parseUrl(req.url.replace(/^\/+/, "/"));
            const pathnameInfo = (0, _getNextPathnameInfo).getNextPathnameInfo(url.pathname, {
                nextConfig: this.nextConfig
            });
            url.pathname = pathnameInfo.pathname;
            if (pathnameInfo.basePath) {
                req.url = (0, _removePathPrefix).removePathPrefix(req.url, this.nextConfig.basePath);
                (0, _requestMeta).addRequestMeta(req, "_nextHadBasePath", true);
            }
            if (this.minimalMode && typeof req.headers["x-matched-path"] === "string") {
                try {
                    // x-matched-path is the source of truth, it tells what page
                    // should be rendered because we don't process rewrites in minimalMode
                    let matchedPath = new URL(req.headers["x-matched-path"], "http://localhost").pathname;
                    let urlPathname = new URL(req.url, "http://localhost").pathname;
                    // For ISR  the URL is normalized to the prerenderPath so if
                    // it's a data request the URL path will be the data URL,
                    // basePath is already stripped by this point
                    if (urlPathname.startsWith(`/_next/data/`)) {
                        parsedUrl.query.__nextDataReq = "1";
                    }
                    const normalizedUrlPath = this.stripNextDataPath(urlPathname);
                    matchedPath = this.stripNextDataPath(matchedPath, false);
                    if (this.nextConfig.i18n) {
                        const localeResult = (0, _normalizeLocalePath).normalizeLocalePath(matchedPath, this.nextConfig.i18n.locales);
                        matchedPath = localeResult.pathname;
                        if (localeResult.detectedLocale) {
                            parsedUrl.query.__nextLocale = localeResult.detectedLocale;
                        }
                    }
                    matchedPath = (0, _denormalizePagePath).denormalizePagePath(matchedPath);
                    let srcPathname = matchedPath;
                    if (!(0, _utils1).isDynamicRoute(srcPathname) && !await this.hasPage((0, _removeTrailingSlash).removeTrailingSlash(srcPathname))) {
                        for (const dynamicRoute of this.dynamicRoutes || []){
                            if (dynamicRoute.match(srcPathname)) {
                                srcPathname = dynamicRoute.page;
                                break;
                            }
                        }
                    }
                    const pageIsDynamic = (0, _utils1).isDynamicRoute(srcPathname);
                    const utils = (0, _utils3).getUtils({
                        pageIsDynamic,
                        page: srcPathname,
                        i18n: this.nextConfig.i18n,
                        basePath: this.nextConfig.basePath,
                        rewrites: this.customRoutes.rewrites
                    });
                    // ensure parsedUrl.pathname includes URL before processing
                    // rewrites or they won't match correctly
                    if (defaultLocale && !pathnameInfo.locale) {
                        parsedUrl.pathname = `/${defaultLocale}${parsedUrl.pathname}`;
                    }
                    const pathnameBeforeRewrite = parsedUrl.pathname;
                    const rewriteParams = utils.handleRewrites(req, parsedUrl);
                    const rewriteParamKeys = Object.keys(rewriteParams);
                    const didRewrite = pathnameBeforeRewrite !== parsedUrl.pathname;
                    if (didRewrite) {
                        (0, _requestMeta).addRequestMeta(req, "_nextRewroteUrl", parsedUrl.pathname);
                        (0, _requestMeta).addRequestMeta(req, "_nextDidRewrite", true);
                    }
                    // interpolate dynamic params and normalize URL if needed
                    if (pageIsDynamic) {
                        let params = {};
                        let paramsResult = utils.normalizeDynamicRouteParams(parsedUrl.query);
                        // for prerendered ISR paths we attempt parsing the route
                        // params from the URL directly as route-matches may not
                        // contain the correct values due to the filesystem path
                        // matching before the dynamic route has been matched
                        if (!paramsResult.hasValidParams && pageIsDynamic && !(0, _utils1).isDynamicRoute(normalizedUrlPath)) {
                            let matcherParams = utils.dynamicRouteMatcher == null ? void 0 : utils.dynamicRouteMatcher(normalizedUrlPath);
                            if (matcherParams) {
                                utils.normalizeDynamicRouteParams(matcherParams);
                                Object.assign(paramsResult.params, matcherParams);
                                paramsResult.hasValidParams = true;
                            }
                        }
                        if (paramsResult.hasValidParams) {
                            params = paramsResult.params;
                        }
                        if (req.headers["x-now-route-matches"] && (0, _utils1).isDynamicRoute(matchedPath) && !paramsResult.hasValidParams) {
                            const opts = {};
                            const routeParams = utils.getParamsFromRouteMatches(req, opts, parsedUrl.query.__nextLocale || "");
                            if (opts.locale) {
                                parsedUrl.query.__nextLocale = opts.locale;
                            }
                            paramsResult = utils.normalizeDynamicRouteParams(routeParams, true);
                            if (paramsResult.hasValidParams) {
                                params = paramsResult.params;
                            }
                        }
                        // handle the actual dynamic route name being requested
                        if (pageIsDynamic && utils.defaultRouteMatches && normalizedUrlPath === srcPathname && !paramsResult.hasValidParams && !utils.normalizeDynamicRouteParams({
                            ...params
                        }, true).hasValidParams) {
                            params = utils.defaultRouteMatches;
                        }
                        if (params) {
                            matchedPath = utils.interpolateDynamicPath(srcPathname, params);
                            req.url = utils.interpolateDynamicPath(req.url, params);
                        }
                        Object.assign(parsedUrl.query, params);
                    }
                    if (pageIsDynamic || didRewrite) {
                        var ref3;
                        utils.normalizeVercelUrl(req, true, [
                            ...rewriteParamKeys,
                            ...Object.keys(((ref3 = utils.defaultRouteRegex) == null ? void 0 : ref3.groups) || {}), 
                        ]);
                    }
                    parsedUrl.pathname = `${this.nextConfig.basePath || ""}${matchedPath === "/" && this.nextConfig.basePath ? "" : matchedPath}`;
                    url.pathname = parsedUrl.pathname;
                } catch (err) {
                    if (err instanceof _utils.DecodeError || err instanceof _utils.NormalizeError) {
                        res.statusCode = 400;
                        return this.renderError(null, req, res, "/_error", {});
                    }
                    throw err;
                }
            }
            (0, _requestMeta).addRequestMeta(req, "__nextHadTrailingSlash", pathnameInfo.trailingSlash);
            (0, _requestMeta).addRequestMeta(req, "__nextIsLocaleDomain", Boolean(domainLocale));
            parsedUrl.query.__nextDefaultLocale = defaultLocale;
            if (pathnameInfo.locale) {
                req.url = (0, _url).format(url);
                (0, _requestMeta).addRequestMeta(req, "__nextStrippedLocale", true);
            }
            if (!this.minimalMode || !parsedUrl.query.__nextLocale) {
                if (pathnameInfo.locale || defaultLocale) {
                    parsedUrl.query.__nextLocale = pathnameInfo.locale || defaultLocale;
                }
            }
            if (!this.minimalMode && defaultLocale) {
                const redirect = (0, _getLocaleRedirect).getLocaleRedirect({
                    defaultLocale,
                    domainLocale,
                    headers: req.headers,
                    nextConfig: this.nextConfig,
                    pathLocale: pathnameInfo.locale,
                    urlParsed: {
                        ...url,
                        pathname: pathnameInfo.locale ? `/${pathnameInfo.locale}${url.pathname}` : url.pathname
                    }
                });
                if (redirect) {
                    return res.redirect(redirect, _constants.TEMPORARY_REDIRECT_STATUS).body(redirect).send();
                }
            }
            res.statusCode = 200;
            return await this.run(req, res, parsedUrl);
        } catch (err) {
            if (err && typeof err === "object" && err.code === "ERR_INVALID_URL" || err instanceof _utils.DecodeError || err instanceof _utils.NormalizeError) {
                res.statusCode = 400;
                return this.renderError(null, req, res, "/_error", {});
            }
            if (this.minimalMode || this.renderOpts.dev) {
                throw err;
            }
            this.logError((0, _isError).getProperError(err));
            res.statusCode = 500;
            res.body("Internal Server Error").send();
        }
    }
    getRequestHandler() {
        return this.handleRequest.bind(this);
    }
    async handleUpgrade(_req, _socket, _head) {}
    setAssetPrefix(prefix) {
        this.renderOpts.assetPrefix = prefix ? prefix.replace(/\/$/, "") : "";
    }
    // Backwards compatibility
    async prepare() {}
    // Backwards compatibility
    async close() {}
    getPreviewProps() {
        return this.getPrerenderManifest().preview;
    }
    async _beforeCatchAllRender(_req, _res, _params, _parsedUrl) {
        return false;
    }
    getDynamicRoutes() {
        const addedPages = new Set();
        return (0, _utils1).getSortedRoutes([
            ...Object.keys(this.appPathRoutes || {}),
            ...Object.keys(this.pagesManifest), 
        ].map((page)=>{
            var ref;
            return (0, _normalizeLocalePath).normalizeLocalePath(page, (ref = this.nextConfig.i18n) == null ? void 0 : ref.locales).pathname;
        })).map((page)=>{
            if (addedPages.has(page) || !(0, _utils1).isDynamicRoute(page)) return null;
            addedPages.add(page);
            return {
                page,
                match: (0, _routeMatcher).getRouteMatcher((0, _routeRegex).getRouteRegex(page))
            };
        }).filter((item)=>Boolean(item));
    }
    getAppPathRoutes() {
        const appPathRoutes = {};
        Object.keys(this.appPathsManifest || {}).forEach((entry)=>{
            const normalizedPath = (0, _appPaths).normalizeAppPath(entry) || "/";
            if (!appPathRoutes[normalizedPath]) {
                appPathRoutes[normalizedPath] = [];
            }
            appPathRoutes[normalizedPath].push(entry);
        });
        return appPathRoutes;
    }
    async run(req, res, parsedUrl) {
        this.handleCompression(req, res);
        try {
            const matched = await this.router.execute(req, res, parsedUrl);
            if (matched) {
                return;
            }
        } catch (err) {
            if (err instanceof _utils.DecodeError || err instanceof _utils.NormalizeError) {
                res.statusCode = 400;
                return this.renderError(null, req, res, "/_error", {});
            }
            throw err;
        }
        await this.render404(req, res, parsedUrl);
    }
    async pipe(fn, partialContext) {
        const isBotRequest = (0, _isBot).isBot(partialContext.req.headers["user-agent"] || "");
        const ctx = {
            ...partialContext,
            renderOpts: {
                ...this.renderOpts,
                supportsDynamicHTML: !isBotRequest
            }
        };
        const payload = await fn(ctx);
        if (payload === null) {
            return;
        }
        const { req , res  } = ctx;
        const { body , type , revalidateOptions  } = payload;
        if (!res.sent) {
            const { generateEtags , poweredByHeader , dev  } = this.renderOpts;
            if (dev) {
                // In dev, we should not cache pages for any reason.
                res.setHeader("Cache-Control", "no-store, must-revalidate");
            }
            return this.sendRenderResult(req, res, {
                result: body,
                type,
                generateEtags,
                poweredByHeader,
                options: revalidateOptions
            });
        }
    }
    async getStaticHTML(fn, partialContext) {
        const payload = await fn({
            ...partialContext,
            renderOpts: {
                ...this.renderOpts,
                supportsDynamicHTML: false
            }
        });
        if (payload === null) {
            return null;
        }
        return payload.body.toUnchunkedString();
    }
    async render(req, res, pathname, query = {}, parsedUrl, internalRender = false) {
        var ref;
        if (!pathname.startsWith("/")) {
            console.warn(`Cannot render page with path "${pathname}", did you mean "/${pathname}"?. See more info here: https://nextjs.org/docs/messages/render-no-starting-slash`);
        }
        if (this.renderOpts.customServer && pathname === "/index" && !await this.hasPage("/index")) {
            // maintain backwards compatibility for custom server
            // (see custom-server integration tests)
            pathname = "/";
        }
        // we allow custom servers to call render for all URLs
        // so check if we need to serve a static _next file or not.
        // we don't modify the URL for _next/data request but still
        // call render so we special case this to prevent an infinite loop
        if (!internalRender && !this.minimalMode && !query.__nextDataReq && (((ref = req.url) == null ? void 0 : ref.match(/^\/_next\//)) || this.hasStaticDir && req.url.match(/^\/static\//))) {
            return this.handleRequest(req, res, parsedUrl);
        }
        // Custom server users can run `app.render()` which needs compression.
        if (this.renderOpts.customServer) {
            this.handleCompression(req, res);
        }
        if ((0, _utils2).isBlockedPage(pathname)) {
            return this.render404(req, res, parsedUrl);
        }
        return this.pipe((ctx)=>this.renderToResponse(ctx), {
            req,
            res,
            pathname,
            query
        });
    }
    async getStaticPaths({ pathname  }) {
        var ref;
        // `staticPaths` is intentionally set to `undefined` as it should've
        // been caught when checking disk data.
        const staticPaths = undefined;
        // Read whether or not fallback should exist from the manifest.
        const fallbackField = (ref = this.getPrerenderManifest().dynamicRoutes[pathname]) == null ? void 0 : ref.fallback;
        return {
            staticPaths,
            fallbackMode: typeof fallbackField === "string" ? "static" : fallbackField === null ? "blocking" : fallbackField
        };
    }
    async renderToResponseWithComponents({ req , res , pathname , renderOpts: opts  }, { components , query  }) {
        var ref, ref4, ref5, ref6, ref7;
        const is404Page = pathname === "/404";
        const is500Page = pathname === "/500";
        const isAppPath = components.isAppPath;
        const isLikeServerless = typeof components.ComponentMod === "object" && typeof components.ComponentMod.renderReqToHTML === "function";
        const hasServerProps = !!components.getServerSideProps;
        let hasStaticPaths = !!components.getStaticPaths;
        const hasGetInitialProps = !!((ref = components.Component) == null ? void 0 : ref.getInitialProps);
        const isServerComponent = !!((ref4 = components.ComponentMod) == null ? void 0 : ref4.__next_rsc__);
        let isSSG = !!components.getStaticProps || // For static server component pages, we currently always consider them
        // as SSG since we also need to handle the next data (flight JSON).
        (isServerComponent && !hasServerProps && !hasGetInitialProps && process.env.NEXT_RUNTIME !== "edge");
        // Toggle whether or not this is a Data request
        const isDataReq = !!(query.__nextDataReq || req.headers["x-nextjs-data"] && this.serverOptions.webServerConfig) && (isSSG || hasServerProps || isServerComponent);
        delete query.__nextDataReq;
        // Compute the iSSG cache key. We use the rewroteUrl since
        // pages with fallback: false are allowed to be rewritten to
        // and we need to look up the path by the rewritten path
        let urlPathname = (0, _url).parse(req.url || "").pathname || "/";
        let resolvedUrlPathname = (0, _requestMeta).getRequestMeta(req, "_nextRewroteUrl") || urlPathname;
        let staticPaths;
        let fallbackMode;
        if (isAppPath) {
            const pathsResult = await this.getStaticPaths({
                pathname,
                originalAppPath: components.pathname
            });
            staticPaths = pathsResult.staticPaths;
            fallbackMode = pathsResult.fallbackMode;
            const hasFallback = typeof fallbackMode !== "undefined";
            if (hasFallback) {
                hasStaticPaths = true;
            }
            if (hasFallback || (staticPaths == null ? void 0 : staticPaths.includes(resolvedUrlPathname))) {
                isSSG = true;
            }
        }
        // normalize req.url for SSG paths as it is not exposed
        // to getStaticProps and the asPath should not expose /_next/data
        if (isSSG && this.minimalMode && req.headers["x-matched-path"] && req.url.startsWith("/_next/data")) {
            req.url = this.stripNextDataPath(req.url);
        }
        if (!isServerComponent && !!req.headers["x-nextjs-data"] && (!res.statusCode || res.statusCode === 200)) {
            res.setHeader("x-nextjs-matched-path", `${query.__nextLocale ? `/${query.__nextLocale}` : ""}${pathname}`);
        }
        // Don't delete query.__flight__ yet, it still needs to be used in renderToHTML later
        const isFlightRequest = Boolean(this.serverComponentManifest && query.__flight__);
        // we need to ensure the status code if /404 is visited directly
        if (is404Page && !isDataReq && !isFlightRequest) {
            res.statusCode = 404;
        }
        // ensure correct status is set when visiting a status page
        // directly e.g. /500
        if (_constants.STATIC_STATUS_PAGES.includes(pathname)) {
            res.statusCode = parseInt(pathname.slice(1), 10);
        }
        // static pages can only respond to GET/HEAD
        // requests so ensure we respond with 405 for
        // invalid requests
        if (!is404Page && !is500Page && pathname !== "/_error" && req.method !== "HEAD" && req.method !== "GET" && (typeof components.Component === "string" || isSSG)) {
            res.statusCode = 405;
            res.setHeader("Allow", [
                "GET",
                "HEAD"
            ]);
            await this.renderError(null, req, res, pathname);
            return null;
        }
        // handle static page
        if (typeof components.Component === "string") {
            return {
                type: "html",
                // TODO: Static pages should be serialized as RenderResult
                body: _renderResult.default.fromStatic(components.Component)
            };
        }
        if (!query.amp) {
            delete query.amp;
        }
        if (opts.supportsDynamicHTML === true) {
            var ref8;
            const isBotRequest = (0, _isBot).isBot(req.headers["user-agent"] || "");
            const isSupportedDocument = typeof ((ref8 = components.Document) == null ? void 0 : ref8.getInitialProps) !== "function" || // When concurrent features is enabled, the built-in `Document`
            // component also supports dynamic HTML.
            (!!process.env.__NEXT_REACT_ROOT && _constants.NEXT_BUILTIN_DOCUMENT in components.Document);
            // Disable dynamic HTML in cases that we know it won't be generated,
            // so that we can continue generating a cache key when possible.
            // TODO-APP: should the first render for a dynamic app path
            // be static so we can collect revalidate and populate the
            // cache if there are no dynamic data requirements
            opts.supportsDynamicHTML = !isSSG && !isLikeServerless && !isBotRequest && !query.amp && isSupportedDocument;
        }
        const defaultLocale = isSSG ? (ref5 = this.nextConfig.i18n) == null ? void 0 : ref5.defaultLocale : query.__nextDefaultLocale;
        const locale = query.__nextLocale;
        const locales = (ref6 = this.nextConfig.i18n) == null ? void 0 : ref6.locales;
        let previewData;
        let isPreviewMode = false;
        if (hasServerProps || isSSG) {
            // For the edge runtime, we don't support preview mode in SSG.
            if (process.env.NEXT_RUNTIME !== "edge") {
                const { tryGetPreviewData  } = require("./api-utils/node");
                previewData = tryGetPreviewData(req, res, this.renderOpts.previewProps);
                isPreviewMode = previewData !== false;
            }
        }
        let isManualRevalidate = false;
        let revalidateOnlyGenerated = false;
        if (isSSG) {
            ({ isManualRevalidate , revalidateOnlyGenerated  } = (0, _apiUtils).checkIsManualRevalidate(req, this.renderOpts.previewProps));
        }
        if (isSSG && this.minimalMode && req.headers["x-matched-path"]) {
            // the url value is already correct when the matched-path header is set
            resolvedUrlPathname = urlPathname;
        }
        urlPathname = (0, _removeTrailingSlash).removeTrailingSlash(urlPathname);
        resolvedUrlPathname = (0, _normalizeLocalePath).normalizeLocalePath((0, _removeTrailingSlash).removeTrailingSlash(resolvedUrlPathname), (ref7 = this.nextConfig.i18n) == null ? void 0 : ref7.locales).pathname;
        const handleRedirect = (pageData)=>{
            const redirect = {
                destination: pageData.pageProps.__N_REDIRECT,
                statusCode: pageData.pageProps.__N_REDIRECT_STATUS,
                basePath: pageData.pageProps.__N_REDIRECT_BASE_PATH
            };
            const statusCode = (0, _redirectStatus).getRedirectStatus(redirect);
            const { basePath  } = this.nextConfig;
            if (basePath && redirect.basePath !== false && redirect.destination.startsWith("/")) {
                redirect.destination = `${basePath}${redirect.destination}`;
            }
            if (redirect.destination.startsWith("/")) {
                redirect.destination = (0, _utils).normalizeRepeatedSlashes(redirect.destination);
            }
            res.redirect(redirect.destination, statusCode).body(redirect.destination).send();
        };
        // remove /_next/data prefix from urlPathname so it matches
        // for direct page visit and /_next/data visit
        if (isDataReq) {
            resolvedUrlPathname = this.stripNextDataPath(resolvedUrlPathname);
            urlPathname = this.stripNextDataPath(urlPathname);
        }
        let ssgCacheKey = isPreviewMode || !isSSG || opts.supportsDynamicHTML || isFlightRequest ? null // Preview mode, manual revalidate, flight request can bypass the cache
         : `${locale ? `/${locale}` : ""}${(pathname === "/" || resolvedUrlPathname === "/") && locale ? "" : resolvedUrlPathname}${query.amp ? ".amp" : ""}`;
        if ((is404Page || is500Page) && isSSG) {
            ssgCacheKey = `${locale ? `/${locale}` : ""}${pathname}${query.amp ? ".amp" : ""}`;
        }
        if (ssgCacheKey) {
            // we only encode path delimiters for path segments from
            // getStaticPaths so we need to attempt decoding the URL
            // to match against and only escape the path delimiters
            // this allows non-ascii values to be handled e.g. Japanese characters
            // TODO: investigate adding this handling for non-SSG pages so
            // non-ascii names work there also
            ssgCacheKey = ssgCacheKey.split("/").map((seg)=>{
                try {
                    seg = (0, _escapePathDelimiters).default(decodeURIComponent(seg), true);
                } catch (_) {
                    // An improperly encoded URL was provided
                    throw new _utils.DecodeError("failed to decode param");
                }
                return seg;
            }).join("/");
            // ensure /index and / is normalized to one key
            ssgCacheKey = ssgCacheKey === "/index" && pathname === "/" ? "/" : ssgCacheKey;
        }
        const doRender = async ()=>{
            let pageData;
            let body;
            let sprRevalidate;
            let isNotFound;
            let isRedirect;
            // handle serverless
            if (isLikeServerless) {
                const renderResult = await components.ComponentMod.renderReqToHTML(req, res, "passthrough", {
                    locale,
                    locales,
                    defaultLocale,
                    optimizeFonts: this.renderOpts.optimizeFonts,
                    optimizeCss: this.renderOpts.optimizeCss,
                    nextScriptWorkers: this.renderOpts.nextScriptWorkers,
                    distDir: this.distDir,
                    fontManifest: this.renderOpts.fontManifest,
                    domainLocales: this.renderOpts.domainLocales
                });
                body = renderResult.html;
                pageData = renderResult.renderOpts.pageData;
                sprRevalidate = renderResult.renderOpts.revalidate;
                isNotFound = renderResult.renderOpts.isNotFound;
                isRedirect = renderResult.renderOpts.isRedirect;
            } else {
                const origQuery = (0, _url).parse(req.url || "", true).query;
                // clear any dynamic route params so they aren't in
                // the resolvedUrl
                if (opts.params) {
                    Object.keys(opts.params).forEach((key)=>{
                        delete origQuery[key];
                    });
                }
                const hadTrailingSlash = urlPathname !== "/" && this.nextConfig.trailingSlash;
                const resolvedUrl = (0, _url).format({
                    pathname: `${resolvedUrlPathname}${hadTrailingSlash ? "/" : ""}`,
                    // make sure to only add query values from original URL
                    query: origQuery
                });
                const renderOpts = {
                    ...components,
                    ...opts,
                    isDataReq,
                    resolvedUrl,
                    locale,
                    locales,
                    defaultLocale,
                    // For getServerSideProps and getInitialProps we need to ensure we use the original URL
                    // and not the resolved URL to prevent a hydration mismatch on
                    // asPath
                    resolvedAsPath: hasServerProps || hasGetInitialProps ? (0, _url).format({
                        // we use the original URL pathname less the _next/data prefix if
                        // present
                        pathname: `${urlPathname}${hadTrailingSlash ? "/" : ""}`,
                        query: origQuery
                    }) : resolvedUrl
                };
                if (isSSG || hasStaticPaths) {
                    renderOpts.supportsDynamicHTML = false;
                }
                const renderResult = await this.renderHTML(req, res, pathname, query, renderOpts);
                body = renderResult;
                // TODO: change this to a different passing mechanism
                pageData = renderOpts.pageData;
                sprRevalidate = renderOpts.revalidate;
                isNotFound = renderOpts.isNotFound;
                isRedirect = renderOpts.isRedirect;
            }
            let value;
            if (isNotFound) {
                value = null;
            } else if (isRedirect) {
                value = {
                    kind: "REDIRECT",
                    props: pageData
                };
            } else {
                if (!body) {
                    return null;
                }
                value = {
                    kind: "PAGE",
                    html: body,
                    pageData
                };
            }
            return {
                revalidate: sprRevalidate,
                value
            };
        };
        const cacheEntry = await this.responseCache.get(ssgCacheKey, async (hasResolved, hadCache)=>{
            const isProduction = !this.renderOpts.dev;
            const isDynamicPathname = (0, _utils1).isDynamicRoute(pathname);
            const didRespond = hasResolved || res.sent;
            if (!staticPaths) {
                ({ staticPaths , fallbackMode  } = hasStaticPaths ? await this.getStaticPaths({
                    pathname
                }) : {
                    staticPaths: undefined,
                    fallbackMode: false
                });
            }
            if (fallbackMode === "static" && (0, _isBot).isBot(req.headers["user-agent"] || "")) {
                fallbackMode = "blocking";
            }
            // skip manual revalidate if cache is not present and
            // revalidate-if-generated is set
            if (isManualRevalidate && revalidateOnlyGenerated && !hadCache && !this.minimalMode) {
                await this.render404(req, res);
                return null;
            }
            // only allow manual revalidate for fallback: true/blocking
            // or for prerendered fallback: false paths
            if (isManualRevalidate && (fallbackMode !== false || hadCache)) {
                fallbackMode = "blocking";
            }
            // When we did not respond from cache, we need to choose to block on
            // rendering or return a skeleton.
            //
            // * Data requests always block.
            //
            // * Blocking mode fallback always blocks.
            //
            // * Preview mode toggles all pages to be resolved in a blocking manner.
            //
            // * Non-dynamic pages should block (though this is an impossible
            //   case in production).
            //
            // * Dynamic pages should return their skeleton if not defined in
            //   getStaticPaths, then finish the data request on the client-side.
            //
            if (this.minimalMode !== true && fallbackMode !== "blocking" && ssgCacheKey && !didRespond && !isPreviewMode && isDynamicPathname && // Development should trigger fallback when the path is not in
            // `getStaticPaths`
            (isProduction || !staticPaths || !staticPaths.includes(// we use ssgCacheKey here as it is normalized to match the
            // encoding from getStaticPaths along with including the locale
            query.amp ? ssgCacheKey.replace(/\.amp$/, "") : ssgCacheKey))) {
                if (// In development, fall through to render to handle missing
                // getStaticPaths.
                (isProduction || staticPaths) && // When fallback isn't present, abort this render so we 404
                fallbackMode !== "static") {
                    throw new NoFallbackError();
                }
                if (!isDataReq) {
                    // Production already emitted the fallback as static HTML.
                    if (isProduction) {
                        const html = await this.getFallback(locale ? `/${locale}${pathname}` : pathname);
                        return {
                            value: {
                                kind: "PAGE",
                                html: _renderResult.default.fromStatic(html),
                                pageData: {}
                            }
                        };
                    } else {
                        query.__nextFallback = "true";
                        if (isLikeServerless) {
                            prepareServerlessUrl(req, query);
                        }
                        const result = await doRender();
                        if (!result) {
                            return null;
                        }
                        // Prevent caching this result
                        delete result.revalidate;
                        return result;
                    }
                }
            }
            const result = await doRender();
            if (!result) {
                return null;
            }
            return {
                ...result,
                revalidate: result.revalidate !== undefined ? result.revalidate : /* default to minimum revalidate (this should be an invariant) */ 1
            };
        }, {
            isManualRevalidate,
            isPrefetch: req.headers.purpose === "prefetch"
        });
        if (!cacheEntry) {
            if (ssgCacheKey && !(isManualRevalidate && revalidateOnlyGenerated)) {
                // A cache entry might not be generated if a response is written
                // in `getInitialProps` or `getServerSideProps`, but those shouldn't
                // have a cache key. If we do have a cache key but we don't end up
                // with a cache entry, then either Next.js or the application has a
                // bug that needs fixing.
                throw new Error("invariant: cache entry required but not generated");
            }
            return null;
        }
        if (isSSG && !this.minimalMode) {
            // set x-nextjs-cache header to match the header
            // we set for the image-optimizer
            res.setHeader("x-nextjs-cache", isManualRevalidate ? "REVALIDATED" : cacheEntry.isMiss ? "MISS" : cacheEntry.isStale ? "STALE" : "HIT");
        }
        const { revalidate , value: cachedData  } = cacheEntry;
        const revalidateOptions = typeof revalidate !== "undefined" && (!this.renderOpts.dev || hasServerProps && !isDataReq) ? {
            // When the page is 404 cache-control should not be added unless
            // we are rendering the 404 page for notFound: true which should
            // cache according to revalidate correctly
            private: isPreviewMode || is404Page && cachedData,
            stateful: !isSSG,
            revalidate
        } : undefined;
        if (!cachedData) {
            if (revalidateOptions) {
                (0, _revalidateHeaders).setRevalidateHeaders(res, revalidateOptions);
            }
            if (isDataReq) {
                res.statusCode = 404;
                res.body('{"notFound":true}').send();
                return null;
            } else {
                if (this.renderOpts.dev) {
                    query.__nextNotFoundSrcPage = pathname;
                }
                await this.render404(req, res, {
                    pathname,
                    query
                }, false);
                return null;
            }
        } else if (cachedData.kind === "REDIRECT") {
            if (revalidateOptions) {
                (0, _revalidateHeaders).setRevalidateHeaders(res, revalidateOptions);
            }
            if (isDataReq) {
                return {
                    type: "json",
                    body: _renderResult.default.fromStatic(// @TODO: Handle flight data.
                    JSON.stringify(cachedData.props)),
                    revalidateOptions
                };
            } else {
                await handleRedirect(cachedData.props);
                return null;
            }
        } else if (cachedData.kind === "IMAGE") {
            throw new Error("invariant SSG should not return an image cache value");
        } else {
            return {
                type: isDataReq ? "json" : "html",
                body: isDataReq ? _renderResult.default.fromStatic(JSON.stringify(cachedData.pageData)) : cachedData.html,
                revalidateOptions
            };
        }
    }
    stripNextDataPath(path, stripLocale = true) {
        if (path.includes(this.buildId)) {
            const splitPath = path.substring(path.indexOf(this.buildId) + this.buildId.length);
            path = (0, _denormalizePagePath).denormalizePagePath(splitPath.replace(/\.json$/, ""));
        }
        if (this.nextConfig.i18n && stripLocale) {
            const { locales  } = this.nextConfig.i18n;
            return (0, _normalizeLocalePath).normalizeLocalePath(path, locales).pathname;
        }
        return path;
    }
    // map the route to the actual bundle name
    getOriginalAppPaths(route) {
        if (this.nextConfig.experimental.appDir) {
            var ref;
            const originalAppPath = (ref = this.appPathRoutes) == null ? void 0 : ref[route];
            if (!originalAppPath) {
                return null;
            }
            return originalAppPath;
        }
        return null;
    }
    async renderPageComponent(ctx, bubbleNoFallback) {
        var ref;
        const { query , pathname  } = ctx;
        const appPaths = this.getOriginalAppPaths(pathname);
        const isAppPath = Array.isArray(appPaths);
        let page = pathname;
        if (isAppPath) {
            // When it's an array, we need to pass all parallel routes to the loader.
            page = appPaths[0];
        }
        const result = await this.findPageComponents({
            pathname: page,
            query,
            params: ctx.renderOpts.params || {},
            isAppPath,
            appPaths,
            sriEnabled: !!((ref = this.nextConfig.experimental.sri) == null ? void 0 : ref.algorithm)
        });
        if (result) {
            try {
                return await this.renderToResponseWithComponents(ctx, result);
            } catch (err) {
                const isNoFallbackError = err instanceof NoFallbackError;
                if (!isNoFallbackError || isNoFallbackError && bubbleNoFallback) {
                    throw err;
                }
            }
        }
        return false;
    }
    async renderToResponse(ctx) {
        const { res , query , pathname  } = ctx;
        let page = pathname;
        const bubbleNoFallback = !!query._nextBubbleNoFallback;
        delete query._nextBubbleNoFallback;
        try {
            // Ensure a request to the URL /accounts/[id] will be treated as a dynamic
            // route correctly and not loaded immediately without parsing params.
            if (!(0, _utils1).isDynamicRoute(page)) {
                const result = await this.renderPageComponent(ctx, bubbleNoFallback);
                if (result !== false) return result;
            }
            if (this.dynamicRoutes) {
                for (const dynamicRoute of this.dynamicRoutes){
                    const params = dynamicRoute.match(pathname);
                    if (!params) {
                        continue;
                    }
                    page = dynamicRoute.page;
                    const result = await this.renderPageComponent({
                        ...ctx,
                        pathname: page,
                        renderOpts: {
                            ...ctx.renderOpts,
                            params
                        }
                    }, bubbleNoFallback);
                    if (result !== false) return result;
                }
            }
            // currently edge functions aren't receiving the x-matched-path
            // header so we need to fallback to matching the current page
            // when we weren't able to match via dynamic route to handle
            // the rewrite case
            // @ts-expect-error extended in child class web-server
            if (this.serverOptions.webServerConfig) {
                // @ts-expect-error extended in child class web-server
                ctx.pathname = this.serverOptions.webServerConfig.page;
                const result = await this.renderPageComponent(ctx, bubbleNoFallback);
                if (result !== false) return result;
            }
        } catch (error) {
            const err = (0, _isError).getProperError(error);
            if (error instanceof _utils.MissingStaticPage) {
                console.error("Invariant: failed to load static page", JSON.stringify({
                    page,
                    url: ctx.req.url,
                    matchedPath: ctx.req.headers["x-matched-path"],
                    initUrl: (0, _requestMeta).getRequestMeta(ctx.req, "__NEXT_INIT_URL"),
                    didRewrite: (0, _requestMeta).getRequestMeta(ctx.req, "_nextDidRewrite"),
                    rewroteUrl: (0, _requestMeta).getRequestMeta(ctx.req, "_nextRewroteUrl")
                }, null, 2));
                throw err;
            }
            if (err instanceof NoFallbackError && bubbleNoFallback) {
                throw err;
            }
            if (err instanceof _utils.DecodeError || err instanceof _utils.NormalizeError) {
                res.statusCode = 400;
                return await this.renderErrorToResponse(ctx, err);
            }
            res.statusCode = 500;
            // if pages/500 is present we still need to trigger
            // /_error `getInitialProps` to allow reporting error
            if (await this.hasPage("/500")) {
                ctx.query.__nextCustomErrorRender = "1";
                await this.renderErrorToResponse(ctx, err);
                delete ctx.query.__nextCustomErrorRender;
            }
            const isWrappedError = err instanceof WrappedBuildError;
            if (!isWrappedError) {
                if (this.minimalMode && process.env.NEXT_RUNTIME !== "edge" || this.renderOpts.dev) {
                    if ((0, _isError).default(err)) err.page = page;
                    throw err;
                }
                this.logError((0, _isError).getProperError(err));
            }
            const response = await this.renderErrorToResponse(ctx, isWrappedError ? err.innerError : err);
            return response;
        }
        if (this.router.catchAllMiddleware[0] && !!ctx.req.headers["x-nextjs-data"] && (!res.statusCode || res.statusCode === 200 || res.statusCode === 404)) {
            res.setHeader("x-nextjs-matched-path", `${query.__nextLocale ? `/${query.__nextLocale}` : ""}${pathname}`);
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.body("{}");
            res.send();
            return null;
        }
        res.statusCode = 404;
        return this.renderErrorToResponse(ctx, null);
    }
    async renderToHTML(req, res, pathname, query = {}) {
        return this.getStaticHTML((ctx)=>this.renderToResponse(ctx), {
            req,
            res,
            pathname,
            query
        });
    }
    async renderError(err, req, res, pathname, query = {}, setHeaders = true) {
        if (setHeaders) {
            res.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
        }
        return this.pipe(async (ctx)=>{
            const response = await this.renderErrorToResponse(ctx, err);
            if (this.minimalMode && res.statusCode === 500) {
                throw err;
            }
            return response;
        }, {
            req,
            res,
            pathname,
            query
        });
    }
    customErrorNo404Warn = (0, _utils).execOnce(()=>{
        Log.warn(`You have added a custom /_error page without a custom /404 page. This prevents the 404 page from being auto statically optimized.\nSee here for info: https://nextjs.org/docs/messages/custom-error-no-custom-404`);
    });
    async renderErrorToResponse(ctx, err) {
        const { res , query  } = ctx;
        try {
            let result = null;
            const is404 = res.statusCode === 404;
            let using404Page = false;
            // use static 404 page if available and is 404 response
            if (is404 && await this.hasPage("/404")) {
                result = await this.findPageComponents({
                    pathname: "/404",
                    query,
                    params: {},
                    isAppPath: false
                });
                using404Page = result !== null;
            }
            let statusPage = `/${res.statusCode}`;
            if (!ctx.query.__nextCustomErrorRender && !result && _constants.STATIC_STATUS_PAGES.includes(statusPage)) {
                // skip ensuring /500 in dev mode as it isn't used and the
                // dev overlay is used instead
                if (statusPage !== "/500" || !this.renderOpts.dev) {
                    result = await this.findPageComponents({
                        pathname: statusPage,
                        query,
                        params: {},
                        isAppPath: false
                    });
                }
            }
            if (!result) {
                result = await this.findPageComponents({
                    pathname: "/_error",
                    query,
                    params: {},
                    isAppPath: false
                });
                statusPage = "/_error";
            }
            if (process.env.NODE_ENV !== "production" && !using404Page && await this.hasPage("/_error") && !await this.hasPage("/404")) {
                this.customErrorNo404Warn();
            }
            try {
                return await this.renderToResponseWithComponents({
                    ...ctx,
                    pathname: statusPage,
                    renderOpts: {
                        ...ctx.renderOpts,
                        err
                    }
                }, result);
            } catch (maybeFallbackError) {
                if (maybeFallbackError instanceof NoFallbackError) {
                    throw new Error("invariant: failed to render error page");
                }
                throw maybeFallbackError;
            }
        } catch (error) {
            const renderToHtmlError = (0, _isError).getProperError(error);
            const isWrappedError = renderToHtmlError instanceof WrappedBuildError;
            if (!isWrappedError) {
                this.logError(renderToHtmlError);
            }
            res.statusCode = 500;
            const fallbackComponents = await this.getFallbackErrorComponents();
            if (fallbackComponents) {
                return this.renderToResponseWithComponents({
                    ...ctx,
                    pathname: "/_error",
                    renderOpts: {
                        ...ctx.renderOpts,
                        // We render `renderToHtmlError` here because `err` is
                        // already captured in the stacktrace.
                        err: isWrappedError ? renderToHtmlError.innerError : renderToHtmlError
                    }
                }, {
                    query,
                    components: fallbackComponents
                });
            }
            return {
                type: "html",
                body: _renderResult.default.fromStatic("Internal Server Error")
            };
        }
    }
    async renderErrorToHTML(err, req, res, pathname, query = {}) {
        return this.getStaticHTML((ctx)=>this.renderErrorToResponse(ctx, err), {
            req,
            res,
            pathname,
            query
        });
    }
    async getFallbackErrorComponents() {
        // The development server will provide an implementation for this
        return null;
    }
    async render404(req, res, parsedUrl, setHeaders = true) {
        const { pathname , query  } = parsedUrl ? parsedUrl : (0, _url).parse(req.url, true);
        if (this.nextConfig.i18n) {
            query.__nextLocale = query.__nextLocale || this.nextConfig.i18n.defaultLocale;
            query.__nextDefaultLocale = query.__nextDefaultLocale || this.nextConfig.i18n.defaultLocale;
        }
        res.statusCode = 404;
        return this.renderError(null, req, res, pathname, query, setHeaders);
    }
}
exports.default = Server;
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
class NoFallbackError extends Error {
}
exports.NoFallbackError = NoFallbackError;
class WrappedBuildError extends Error {
    constructor(innerError){
        super();
        this.innerError = innerError;
    }
}
exports.WrappedBuildError = WrappedBuildError;
function prepareServerlessUrl(req, query) {
    const curUrl = (0, _url).parse(req.url, true);
    req.url = (0, _url).format({
        ...curUrl,
        search: undefined,
        query: {
            ...curUrl.query,
            ...query
        }
    });
}

//# sourceMappingURL=base-server.js.map