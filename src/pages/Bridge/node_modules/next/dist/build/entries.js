"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPageFromPath = getPageFromPath;
exports.createPagesMapping = createPagesMapping;
exports.getEdgeServerEntry = getEdgeServerEntry;
exports.getAppEntry = getAppEntry;
exports.getServerlessEntry = getServerlessEntry;
exports.getClientEntry = getClientEntry;
exports.runDependingOnPageType = runDependingOnPageType;
exports.createEntrypoints = createEntrypoints;
exports.finalizeEntrypoint = finalizeEntrypoint;
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _path = require("path");
var _querystring = require("querystring");
var _constants = require("../lib/constants");
var _constants1 = require("../shared/lib/constants");
var _utils = require("../server/utils");
var _log = require("./output/log");
var _utils1 = require("./utils");
var _getPageStaticInfo = require("./analysis/get-page-static-info");
var _normalizePathSep = require("../shared/lib/page-path/normalize-path-sep");
var _normalizePagePath = require("../shared/lib/page-path/normalize-page-path");
var _appPaths = require("../shared/lib/router/utils/app-paths");
var _nextMiddlewareLoader = require("./webpack/loaders/next-middleware-loader");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getPageFromPath(pagePath, pageExtensions) {
    let page = (0, _normalizePathSep).normalizePathSep(pagePath.replace(new RegExp(`\\.+(${pageExtensions.join("|")})$`), ""));
    page = page.replace(/\/index$/, "");
    return page === "" ? "/" : page;
}
function createPagesMapping({ isDev , pageExtensions , pagePaths , pagesType , pagesDir  }) {
    const previousPages = {};
    const pages = pagePaths.reduce((result, pagePath)=>{
        // Do not process .d.ts files inside the `pages` folder
        if (pagePath.endsWith(".d.ts") && pageExtensions.includes("ts")) {
            return result;
        }
        const pageKey = getPageFromPath(pagePath, pageExtensions);
        if (pageKey in result) {
            (0, _log).warn(`Duplicate page detected. ${_chalk.default.cyan((0, _path).join("pages", previousPages[pageKey]))} and ${_chalk.default.cyan((0, _path).join("pages", pagePath))} both resolve to ${_chalk.default.cyan(pageKey)}.`);
        } else {
            previousPages[pageKey] = pagePath;
        }
        result[pageKey] = (0, _normalizePathSep).normalizePathSep((0, _path).join(pagesType === "pages" ? _constants.PAGES_DIR_ALIAS : pagesType === "app" ? _constants.APP_DIR_ALIAS : _constants.ROOT_DIR_ALIAS, pagePath));
        return result;
    }, {});
    if (pagesType !== "pages") {
        return pages;
    }
    if (isDev) {
        delete pages["/_app"];
        delete pages["/_error"];
        delete pages["/_document"];
    }
    // In development we always alias these to allow Webpack to fallback to
    // the correct source file so that HMR can work properly when a file is
    // added or removed.
    const root = isDev && pagesDir ? _constants.PAGES_DIR_ALIAS : "next/dist/pages";
    return {
        "/_app": `${root}/_app`,
        "/_error": `${root}/_error`,
        "/_document": `${root}/_document`,
        ...pages
    };
}
function getEdgeServerEntry(opts) {
    var ref;
    if ((0, _utils1).isMiddlewareFile(opts.page)) {
        var ref1;
        const loaderParams = {
            absolutePagePath: opts.absolutePagePath,
            page: opts.page,
            rootDir: opts.rootDir,
            matchers: ((ref1 = opts.middleware) == null ? void 0 : ref1.matchers) ? (0, _nextMiddlewareLoader).encodeMatchers(opts.middleware.matchers) : ""
        };
        return `next-middleware-loader?${(0, _querystring).stringify(loaderParams)}!`;
    }
    if (opts.page.startsWith("/api/") || opts.page === "/api") {
        const loaderParams = {
            absolutePagePath: opts.absolutePagePath,
            page: opts.page,
            rootDir: opts.rootDir
        };
        return `next-edge-function-loader?${(0, _querystring).stringify(loaderParams)}!`;
    }
    const loaderParams = {
        absolute500Path: opts.pages["/500"] || "",
        absoluteAppPath: opts.pages["/_app"],
        absoluteDocumentPath: opts.pages["/_document"],
        absoluteErrorPath: opts.pages["/_error"],
        absolutePagePath: opts.absolutePagePath,
        buildId: opts.buildId,
        dev: opts.isDev,
        isServerComponent: opts.isServerComponent,
        page: opts.page,
        stringifiedConfig: JSON.stringify(opts.config),
        pagesType: opts.pagesType,
        appDirLoader: Buffer.from(opts.appDirLoader || "").toString("base64"),
        sriEnabled: !opts.isDev && !!((ref = opts.config.experimental.sri) == null ? void 0 : ref.algorithm)
    };
    return {
        import: `next-edge-ssr-loader?${(0, _querystring).stringify(loaderParams)}!`,
        layer: opts.isServerComponent ? _constants.WEBPACK_LAYERS.server : undefined
    };
}
function getAppEntry(opts) {
    return {
        import: `next-app-loader?${(0, _querystring).stringify(opts)}!`,
        layer: _constants.WEBPACK_LAYERS.server
    };
}
function getServerlessEntry(opts) {
    const loaderParams = {
        absolute404Path: opts.pages["/404"] || "",
        absoluteAppPath: opts.pages["/_app"],
        absoluteDocumentPath: opts.pages["/_document"],
        absoluteErrorPath: opts.pages["/_error"],
        absolutePagePath: opts.absolutePagePath,
        assetPrefix: opts.config.assetPrefix,
        basePath: opts.config.basePath,
        buildId: opts.buildId,
        canonicalBase: opts.config.amp.canonicalBase || "",
        distDir: _constants.DOT_NEXT_ALIAS,
        generateEtags: opts.config.generateEtags ? "true" : "",
        i18n: opts.config.i18n ? JSON.stringify(opts.config.i18n) : "",
        // base64 encode to make sure contents don't break webpack URL loading
        loadedEnvFiles: Buffer.from(JSON.stringify(opts.envFiles)).toString("base64"),
        page: opts.page,
        poweredByHeader: opts.config.poweredByHeader ? "true" : "",
        previewProps: JSON.stringify(opts.previewMode),
        runtimeConfig: Object.keys(opts.config.publicRuntimeConfig).length > 0 || Object.keys(opts.config.serverRuntimeConfig).length > 0 ? JSON.stringify({
            publicRuntimeConfig: opts.config.publicRuntimeConfig,
            serverRuntimeConfig: opts.config.serverRuntimeConfig
        }) : ""
    };
    return `next-serverless-loader?${(0, _querystring).stringify(loaderParams)}!`;
}
function getClientEntry(opts) {
    const loaderOptions = {
        absolutePagePath: opts.absolutePagePath,
        page: opts.page
    };
    const pageLoader = `next-client-pages-loader?${(0, _querystring).stringify(loaderOptions)}!`;
    // Make sure next/router is a dependency of _app or else chunk splitting
    // might cause the router to not be able to load causing hydration
    // to fail
    return opts.page === "/_app" ? [
        pageLoader,
        require.resolve("../client/router")
    ] : pageLoader;
}
async function runDependingOnPageType(params) {
    if ((0, _utils1).isMiddlewareFile(params.page)) {
        await params.onEdgeServer();
        return;
    }
    if (params.page.match(_constants.API_ROUTE)) {
        if (params.pageRuntime === _constants.SERVER_RUNTIME.edge) {
            await params.onEdgeServer();
            return;
        }
        await params.onServer();
        return;
    }
    if (params.page === "/_document") {
        await params.onServer();
        return;
    }
    if (params.page === "/_app" || params.page === "/_error" || params.page === "/404" || params.page === "/500") {
        await Promise.all([
            params.onClient(),
            params.onServer()
        ]);
        return;
    }
    if (params.pageRuntime === _constants.SERVER_RUNTIME.edge) {
        await Promise.all([
            params.onClient(),
            params.onEdgeServer()
        ]);
        return;
    }
    await Promise.all([
        params.onClient(),
        params.onServer()
    ]);
    return;
}
async function createEntrypoints(params) {
    const { config , pages , pagesDir , isDev , rootDir , rootPaths , target , appDir , appPaths , pageExtensions ,  } = params;
    const edgeServer = {};
    const server = {};
    const client = {};
    const nestedMiddleware = [];
    let middlewareMatchers = undefined;
    let appPathsPerRoute = {};
    if (appDir && appPaths) {
        for(const pathname in appPaths){
            const normalizedPath = (0, _appPaths).normalizeAppPath(pathname) || "/";
            if (!appPathsPerRoute[normalizedPath]) {
                appPathsPerRoute[normalizedPath] = [];
            }
            appPathsPerRoute[normalizedPath].push(pathname);
        }
        // Make sure to sort parallel routes to make the result deterministic.
        appPathsPerRoute = Object.fromEntries(Object.entries(appPathsPerRoute).map(([k, v])=>[
                k,
                v.sort()
            ]));
    }
    const getEntryHandler = (mappings, pagesType)=>{
        return async (page)=>{
            const bundleFile = (0, _normalizePagePath).normalizePagePath(page);
            const clientBundlePath = _path.posix.join(pagesType, bundleFile);
            const serverBundlePath = pagesType === "pages" ? _path.posix.join("pages", bundleFile) : pagesType === "app" ? _path.posix.join("app", bundleFile) : bundleFile.slice(1);
            const absolutePagePath = mappings[page];
            // Handle paths that have aliases
            const pageFilePath = (()=>{
                if (absolutePagePath.startsWith(_constants.PAGES_DIR_ALIAS) && pagesDir) {
                    return absolutePagePath.replace(_constants.PAGES_DIR_ALIAS, pagesDir);
                }
                if (absolutePagePath.startsWith(_constants.APP_DIR_ALIAS) && appDir) {
                    return absolutePagePath.replace(_constants.APP_DIR_ALIAS, appDir);
                }
                if (absolutePagePath.startsWith(_constants.ROOT_DIR_ALIAS)) {
                    return absolutePagePath.replace(_constants.ROOT_DIR_ALIAS, rootDir);
                }
                return require.resolve(absolutePagePath);
            })();
            /**
       * When we find a middleware file that is not in the ROOT_DIR we fail.
       * There is no need to check on `dev` as this should only happen when
       * building for production.
       */ if (!absolutePagePath.startsWith(_constants.ROOT_DIR_ALIAS) && /[\\\\/]_middleware$/.test(page)) {
                nestedMiddleware.push(page);
            }
            const isInsideAppDir = !!appDir && (absolutePagePath.startsWith(_constants.APP_DIR_ALIAS) || absolutePagePath.startsWith(appDir));
            const staticInfo = await (0, _getPageStaticInfo).getPageStaticInfo({
                nextConfig: config,
                pageFilePath,
                isDev,
                page
            });
            const isServerComponent = isInsideAppDir && staticInfo.rsc !== _constants1.RSC_MODULE_TYPES.client;
            if ((0, _utils1).isMiddlewareFile(page)) {
                var ref;
                var ref2;
                middlewareMatchers = (ref2 = (ref = staticInfo.middleware) == null ? void 0 : ref.matchers) != null ? ref2 : [
                    {
                        regexp: ".*"
                    }, 
                ];
                if (target === "serverless") {
                    throw new _utils1.MiddlewareInServerlessTargetError();
                }
            }
            await runDependingOnPageType({
                page,
                pageRuntime: staticInfo.runtime,
                onClient: ()=>{
                    if (isServerComponent || isInsideAppDir) {
                    // We skip the initial entries for server component pages and let the
                    // server compiler inject them instead.
                    } else {
                        client[clientBundlePath] = getClientEntry({
                            absolutePagePath: mappings[page],
                            page
                        });
                    }
                },
                onServer: ()=>{
                    if (pagesType === "app" && appDir) {
                        const matchedAppPaths = appPathsPerRoute[(0, _appPaths).normalizeAppPath(page) || "/"];
                        server[serverBundlePath] = getAppEntry({
                            name: serverBundlePath,
                            pagePath: mappings[page],
                            appDir,
                            appPaths: matchedAppPaths,
                            pageExtensions
                        });
                    } else if ((0, _utils).isTargetLikeServerless(target)) {
                        if (page !== "/_app" && page !== "/_document") {
                            server[serverBundlePath] = getServerlessEntry({
                                ...params,
                                absolutePagePath: mappings[page],
                                page
                            });
                        }
                    } else {
                        server[serverBundlePath] = [
                            mappings[page]
                        ];
                    }
                },
                onEdgeServer: ()=>{
                    let appDirLoader = "";
                    if (pagesType === "app") {
                        const matchedAppPaths = appPathsPerRoute[(0, _appPaths).normalizeAppPath(page) || "/"];
                        appDirLoader = getAppEntry({
                            name: serverBundlePath,
                            pagePath: mappings[page],
                            appDir: appDir,
                            appPaths: matchedAppPaths,
                            pageExtensions
                        }).import;
                    }
                    edgeServer[serverBundlePath] = getEdgeServerEntry({
                        ...params,
                        rootDir,
                        absolutePagePath: mappings[page],
                        bundlePath: clientBundlePath,
                        isDev: false,
                        isServerComponent,
                        page,
                        middleware: staticInfo == null ? void 0 : staticInfo.middleware,
                        pagesType,
                        appDirLoader
                    });
                }
            });
        };
    };
    if (appDir && appPaths) {
        const entryHandler = getEntryHandler(appPaths, "app");
        await Promise.all(Object.keys(appPaths).map(entryHandler));
    }
    if (rootPaths) {
        await Promise.all(Object.keys(rootPaths).map(getEntryHandler(rootPaths, "root")));
    }
    await Promise.all(Object.keys(pages).map(getEntryHandler(pages, "pages")));
    if (nestedMiddleware.length > 0) {
        throw new _utils1.NestedMiddlewareError(nestedMiddleware, rootDir, pagesDir);
    }
    return {
        client,
        server,
        edgeServer,
        middlewareMatchers
    };
}
function finalizeEntrypoint({ name , compilerType , value , isServerComponent , appDir  }) {
    const entry = typeof value !== "object" || Array.isArray(value) ? {
        import: value
    } : value;
    const isApi = name.startsWith("pages/api/");
    if (compilerType === _constants1.COMPILER_NAMES.server) {
        return {
            publicPath: isApi ? "" : undefined,
            runtime: isApi ? "webpack-api-runtime" : "webpack-runtime",
            layer: isApi ? _constants.WEBPACK_LAYERS.api : isServerComponent ? _constants.WEBPACK_LAYERS.server : undefined,
            ...entry
        };
    }
    if (compilerType === _constants1.COMPILER_NAMES.edgeServer) {
        return {
            layer: (0, _utils1).isMiddlewareFilename(name) || isApi ? _constants.WEBPACK_LAYERS.middleware : undefined,
            library: {
                name: [
                    "_ENTRIES",
                    `middleware_[name]`
                ],
                type: "assign"
            },
            runtime: _constants1.EDGE_RUNTIME_WEBPACK,
            asyncChunks: false,
            ...entry
        };
    }
    if (// Client special cases
    name !== _constants1.CLIENT_STATIC_FILES_RUNTIME_POLYFILLS && name !== _constants1.CLIENT_STATIC_FILES_RUNTIME_MAIN && name !== _constants1.CLIENT_STATIC_FILES_RUNTIME_MAIN_APP && name !== _constants1.CLIENT_STATIC_FILES_RUNTIME_AMP && name !== _constants1.CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH) {
        // TODO-APP: this is a temporary fix. @shuding is going to change the handling of server components
        if (appDir && entry.import.includes("flight")) {
            return {
                dependOn: _constants1.CLIENT_STATIC_FILES_RUNTIME_MAIN_APP,
                ...entry
            };
        }
        return {
            dependOn: name.startsWith("pages/") && name !== "pages/_app" ? "pages/_app" : _constants1.CLIENT_STATIC_FILES_RUNTIME_MAIN,
            ...entry
        };
    }
    return entry;
}

//# sourceMappingURL=entries.js.map