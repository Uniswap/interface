"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderScriptError = renderScriptError;
exports.default = void 0;
var _webpack = require("next/dist/compiled/webpack/webpack");
var _middleware = require("next/dist/compiled/@next/react-dev-overlay/dist/middleware");
var _hotMiddleware = require("./hot-middleware");
var _path = require("path");
var _entries = require("../../build/entries");
var _output = require("../../build/output");
var Log = _interopRequireWildcard(require("../../build/output/log"));
var _webpackConfig = _interopRequireDefault(require("../../build/webpack-config"));
var _constants = require("../../lib/constants");
var _recursiveDelete = require("../../lib/recursive-delete");
var _constants1 = require("../../shared/lib/constants");
var _pathMatch = require("../../shared/lib/router/utils/path-match");
var _findPageFile = require("../lib/find-page-file");
var _onDemandEntryHandler = require("./on-demand-entry-handler");
var _denormalizePagePath = require("../../shared/lib/page-path/denormalize-page-path");
var _normalizePathSep = require("../../shared/lib/page-path/normalize-path-sep");
var _getRouteFromEntrypoint = _interopRequireDefault(require("../get-route-from-entrypoint"));
var _fileExists = require("../../lib/file-exists");
var _utils = require("../../build/utils");
var _utils1 = require("../../shared/lib/utils");
var _trace = require("../../trace");
var _isError = require("../../lib/is-error");
var _ws = _interopRequireDefault(require("next/dist/compiled/ws"));
var _fs = require("fs");
var _getPageStaticInfo = require("../../build/analysis/get-page-static-info");
class HotReloader {
    clientError = null;
    serverError = null;
    pagesMapping = {};
    constructor(dir, { config , pagesDir , distDir , buildId , previewProps , rewrites , appDir  }){
        this.buildId = buildId;
        this.dir = dir;
        this.interceptors = [];
        this.pagesDir = pagesDir;
        this.appDir = appDir;
        this.distDir = distDir;
        this.clientStats = null;
        this.serverStats = null;
        this.edgeServerStats = null;
        this.serverPrevDocumentHash = null;
        this.config = config;
        this.hasReactRoot = !!process.env.__NEXT_REACT_ROOT;
        this.hasServerComponents = this.hasReactRoot && !!config.experimental.serverComponents;
        this.previewProps = previewProps;
        this.rewrites = rewrites;
        this.hotReloaderSpan = (0, _trace).trace("hot-reloader", undefined, {
            version: "12.3.1"
        });
        // Ensure the hotReloaderSpan is flushed immediately as it's the parentSpan for all processing
        // of the current `next dev` invocation.
        this.hotReloaderSpan.stop();
    }
    async run(req, res, parsedUrl) {
        // Usually CORS support is not needed for the hot-reloader (this is dev only feature)
        // With when the app runs for multi-zones support behind a proxy,
        // the current page is trying to access this URL via assetPrefix.
        // That's when the CORS support is needed.
        const { preflight  } = addCorsSupport(req, res);
        if (preflight) {
            return {};
        }
        // When a request comes in that is a page bundle, e.g. /_next/static/<buildid>/pages/index.js
        // we have to compile the page using on-demand-entries, this middleware will handle doing that
        // by adding the page to on-demand-entries, waiting till it's done
        // and then the bundle will be served like usual by the actual route in server/index.js
        const handlePageBundleRequest = async (pageBundleRes, parsedPageBundleUrl)=>{
            const { pathname  } = parsedPageBundleUrl;
            const params = matchNextPageBundleRequest(pathname);
            if (!params) {
                return {};
            }
            let decodedPagePath;
            try {
                decodedPagePath = `/${params.path.map((param)=>decodeURIComponent(param)).join("/")}`;
            } catch (_) {
                throw new _utils1.DecodeError("failed to decode param");
            }
            const page = (0, _denormalizePagePath).denormalizePagePath(decodedPagePath);
            if (page === "/_error" || _constants1.BLOCKED_PAGES.indexOf(page) === -1) {
                try {
                    await this.ensurePage({
                        page,
                        clientOnly: true
                    });
                } catch (error) {
                    await renderScriptError(pageBundleRes, (0, _isError).getProperError(error));
                    return {
                        finished: true
                    };
                }
                const errors = await this.getCompilationErrors(page);
                if (errors.length > 0) {
                    await renderScriptError(pageBundleRes, errors[0], {
                        verbose: false
                    });
                    return {
                        finished: true
                    };
                }
            }
            return {};
        };
        const { finished  } = await handlePageBundleRequest(res, parsedUrl);
        for (const fn of this.interceptors){
            await new Promise((resolve, reject)=>{
                fn(req, res, (err)=>{
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
        return {
            finished
        };
    }
    onHMR(req, _res, head) {
        wsServer.handleUpgrade(req, req.socket, head, (client)=>{
            var ref, ref1;
            (ref = this.webpackHotMiddleware) == null ? void 0 : ref.onHMR(client);
            (ref1 = this.onDemandEntries) == null ? void 0 : ref1.onHMR(client);
            client.addEventListener("message", ({ data  })=>{
                data = typeof data !== "string" ? data.toString() : data;
                try {
                    const payload = JSON.parse(data);
                    let traceChild;
                    switch(payload.event){
                        case "client-hmr-latency":
                            {
                                traceChild = {
                                    name: payload.event,
                                    startTime: BigInt(payload.startTime * 1000 * 1000),
                                    endTime: BigInt(payload.endTime * 1000 * 1000)
                                };
                                break;
                            }
                        case "client-reload-page":
                        case "client-success":
                            {
                                traceChild = {
                                    name: payload.event
                                };
                                break;
                            }
                        case "client-error":
                            {
                                traceChild = {
                                    name: payload.event,
                                    attrs: {
                                        errorCount: payload.errorCount
                                    }
                                };
                                break;
                            }
                        case "client-warning":
                            {
                                traceChild = {
                                    name: payload.event,
                                    attrs: {
                                        warningCount: payload.warningCount
                                    }
                                };
                                break;
                            }
                        case "client-removed-page":
                        case "client-added-page":
                            {
                                traceChild = {
                                    name: payload.event,
                                    attrs: {
                                        page: payload.page || ""
                                    }
                                };
                                break;
                            }
                        case "client-full-reload":
                            {
                                var _stackTrace;
                                traceChild = {
                                    name: payload.event,
                                    attrs: {
                                        stackTrace: (_stackTrace = payload.stackTrace) != null ? _stackTrace : ""
                                    }
                                };
                                Log.warn("Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/basic-features/fast-refresh#how-it-works");
                                if (payload.stackTrace) {
                                    console.warn(payload.stackTrace);
                                }
                                break;
                            }
                        default:
                            {
                                break;
                            }
                    }
                    if (traceChild) {
                        this.hotReloaderSpan.manualTraceChild(traceChild.name, traceChild.startTime || process.hrtime.bigint(), traceChild.endTime || process.hrtime.bigint(), {
                            ...traceChild.attrs,
                            clientId: payload.id
                        });
                    }
                } catch (_) {
                // invalid WebSocket message
                }
            });
        });
    }
    async clean(span) {
        return span.traceChild("clean").traceAsyncFn(()=>(0, _recursiveDelete).recursiveDelete((0, _path).join(this.dir, this.config.distDir), /^cache/));
    }
    async getWebpackConfig(span) {
        const webpackConfigSpan = span.traceChild("get-webpack-config");
        const pageExtensions = this.config.pageExtensions;
        return webpackConfigSpan.traceAsyncFn(async ()=>{
            const pagePaths = !this.pagesDir ? [] : await webpackConfigSpan.traceChild("get-page-paths").traceAsyncFn(()=>Promise.all([
                    (0, _findPageFile).findPageFile(this.pagesDir, "/_app", pageExtensions, false),
                    (0, _findPageFile).findPageFile(this.pagesDir, "/_document", pageExtensions, false), 
                ]));
            this.pagesMapping = webpackConfigSpan.traceChild("create-pages-mapping").traceFn(()=>(0, _entries).createPagesMapping({
                    isDev: true,
                    pageExtensions: this.config.pageExtensions,
                    pagesType: "pages",
                    pagePaths: pagePaths.filter((i)=>typeof i === "string"),
                    pagesDir: this.pagesDir
                }));
            const entrypoints = await webpackConfigSpan.traceChild("create-entrypoints").traceAsyncFn(()=>(0, _entries).createEntrypoints({
                    appDir: this.appDir,
                    buildId: this.buildId,
                    config: this.config,
                    envFiles: [],
                    isDev: true,
                    pages: this.pagesMapping,
                    pagesDir: this.pagesDir,
                    previewMode: this.previewProps,
                    rootDir: this.dir,
                    target: "server",
                    pageExtensions: this.config.pageExtensions
                }));
            const commonWebpackOptions = {
                dev: true,
                buildId: this.buildId,
                config: this.config,
                hasReactRoot: this.hasReactRoot,
                pagesDir: this.pagesDir,
                rewrites: this.rewrites,
                runWebpackSpan: this.hotReloaderSpan,
                appDir: this.appDir
            };
            return webpackConfigSpan.traceChild("generate-webpack-config").traceAsyncFn(()=>Promise.all([
                    // order is important here
                    (0, _webpackConfig).default(this.dir, {
                        ...commonWebpackOptions,
                        compilerType: _constants1.COMPILER_NAMES.client,
                        entrypoints: entrypoints.client
                    }),
                    (0, _webpackConfig).default(this.dir, {
                        ...commonWebpackOptions,
                        compilerType: _constants1.COMPILER_NAMES.server,
                        entrypoints: entrypoints.server
                    }),
                    (0, _webpackConfig).default(this.dir, {
                        ...commonWebpackOptions,
                        compilerType: _constants1.COMPILER_NAMES.edgeServer,
                        entrypoints: entrypoints.edgeServer
                    }), 
                ]));
        });
    }
    async buildFallbackError() {
        if (this.fallbackWatcher) return;
        const fallbackConfig = await (0, _webpackConfig).default(this.dir, {
            runWebpackSpan: this.hotReloaderSpan,
            dev: true,
            compilerType: _constants1.COMPILER_NAMES.client,
            config: this.config,
            buildId: this.buildId,
            pagesDir: this.pagesDir,
            rewrites: {
                beforeFiles: [],
                afterFiles: [],
                fallback: []
            },
            isDevFallback: true,
            entrypoints: (await (0, _entries).createEntrypoints({
                appDir: this.appDir,
                buildId: this.buildId,
                config: this.config,
                envFiles: [],
                isDev: true,
                pages: {
                    "/_app": "next/dist/pages/_app",
                    "/_error": "next/dist/pages/_error"
                },
                pagesDir: this.pagesDir,
                previewMode: this.previewProps,
                rootDir: this.dir,
                target: "server",
                pageExtensions: this.config.pageExtensions
            })).client,
            hasReactRoot: this.hasReactRoot
        });
        const fallbackCompiler = (0, _webpack).webpack(fallbackConfig);
        this.fallbackWatcher = await new Promise((resolve)=>{
            let bootedFallbackCompiler = false;
            fallbackCompiler.watch(// @ts-ignore webpack supports an array of watchOptions when using a multiCompiler
            fallbackConfig.watchOptions, // Errors are handled separately
            (_err)=>{
                if (!bootedFallbackCompiler) {
                    bootedFallbackCompiler = true;
                    resolve(true);
                }
            });
        });
    }
    async start(initial) {
        const startSpan = this.hotReloaderSpan.traceChild("start");
        startSpan.stop() // Stop immediately to create an artificial parent span
        ;
        if (initial) {
            await this.clean(startSpan);
            // Ensure distDir exists before writing package.json
            await _fs.promises.mkdir(this.distDir, {
                recursive: true
            });
            const distPackageJsonPath = (0, _path).join(this.distDir, "package.json");
            // Ensure commonjs handling is used for files in the distDir (generally .next)
            // Files outside of the distDir can be "type": "module"
            await _fs.promises.writeFile(distPackageJsonPath, '{"type": "commonjs"}');
        }
        this.activeConfigs = await this.getWebpackConfig(startSpan);
        for (const config1 of this.activeConfigs){
            const defaultEntry = config1.entry;
            config1.entry = async (...args)=>{
                // @ts-ignore entry is always a function
                const entrypoints = await defaultEntry(...args);
                const isClientCompilation = config1.name === _constants1.COMPILER_NAMES.client;
                const isNodeServerCompilation = config1.name === _constants1.COMPILER_NAMES.server;
                const isEdgeServerCompilation = config1.name === _constants1.COMPILER_NAMES.edgeServer;
                await Promise.all(Object.keys(_onDemandEntryHandler.entries).map(async (entryKey)=>{
                    const entryData = _onDemandEntryHandler.entries[entryKey];
                    const { bundlePath , dispose  } = entryData;
                    const result = /^(client|server|edge-server)(.*)/g.exec(entryKey);
                    const [, key, page] = result// this match should always happen
                    ;
                    if (key === _constants1.COMPILER_NAMES.client && !isClientCompilation) return;
                    if (key === _constants1.COMPILER_NAMES.server && !isNodeServerCompilation) return;
                    if (key === _constants1.COMPILER_NAMES.edgeServer && !isEdgeServerCompilation) return;
                    const isEntry = entryData.type === _onDemandEntryHandler.EntryTypes.ENTRY;
                    const isChildEntry = entryData.type === _onDemandEntryHandler.EntryTypes.CHILD_ENTRY;
                    // Check if the page was removed or disposed and remove it
                    if (isEntry) {
                        const pageExists = !dispose && await (0, _fileExists).fileExists(entryData.absolutePagePath);
                        if (!pageExists) {
                            delete _onDemandEntryHandler.entries[entryKey];
                            return;
                        }
                    }
                    const isAppPath = !!this.appDir && bundlePath.startsWith("app/");
                    const staticInfo = isEntry ? await (0, _getPageStaticInfo).getPageStaticInfo({
                        pageFilePath: entryData.absolutePagePath,
                        nextConfig: this.config,
                        isDev: true
                    }) : {};
                    const isServerComponent = isAppPath && staticInfo.rsc !== _constants1.RSC_MODULE_TYPES.client;
                    await (0, _entries).runDependingOnPageType({
                        page,
                        pageRuntime: staticInfo.runtime,
                        onEdgeServer: ()=>{
                            // TODO-APP: verify if child entry should support.
                            if (!isEdgeServerCompilation || !isEntry) return;
                            const appDirLoader = isAppPath && this.appDir ? (0, _entries).getAppEntry({
                                name: bundlePath,
                                appPaths: entryData.appPaths,
                                pagePath: _path.posix.join(_constants.APP_DIR_ALIAS, (0, _path).relative(this.appDir, entryData.absolutePagePath).replace(/\\/g, "/")),
                                appDir: this.appDir,
                                pageExtensions: this.config.pageExtensions
                            }).import : undefined;
                            _onDemandEntryHandler.entries[entryKey].status = _onDemandEntryHandler.BUILDING;
                            entrypoints[bundlePath] = (0, _entries).finalizeEntrypoint({
                                compilerType: _constants1.COMPILER_NAMES.edgeServer,
                                name: bundlePath,
                                value: (0, _entries).getEdgeServerEntry({
                                    absolutePagePath: entryData.absolutePagePath,
                                    rootDir: this.dir,
                                    buildId: this.buildId,
                                    bundlePath,
                                    config: this.config,
                                    isDev: true,
                                    page,
                                    pages: this.pagesMapping,
                                    isServerComponent,
                                    appDirLoader,
                                    pagesType: isAppPath ? "app" : undefined
                                }),
                                appDir: this.config.experimental.appDir
                            });
                        },
                        onClient: ()=>{
                            if (!isClientCompilation) return;
                            if (isChildEntry) {
                                _onDemandEntryHandler.entries[entryKey].status = _onDemandEntryHandler.BUILDING;
                                entrypoints[bundlePath] = (0, _entries).finalizeEntrypoint({
                                    name: bundlePath,
                                    compilerType: _constants1.COMPILER_NAMES.client,
                                    value: entryData.request,
                                    appDir: this.config.experimental.appDir
                                });
                            } else {
                                _onDemandEntryHandler.entries[entryKey].status = _onDemandEntryHandler.BUILDING;
                                entrypoints[bundlePath] = (0, _entries).finalizeEntrypoint({
                                    name: bundlePath,
                                    compilerType: _constants1.COMPILER_NAMES.client,
                                    value: (0, _entries).getClientEntry({
                                        absolutePagePath: entryData.absolutePagePath,
                                        page
                                    }),
                                    appDir: this.config.experimental.appDir
                                });
                            }
                        },
                        onServer: ()=>{
                            // TODO-APP: verify if child entry should support.
                            if (!isNodeServerCompilation || !isEntry) return;
                            _onDemandEntryHandler.entries[entryKey].status = _onDemandEntryHandler.BUILDING;
                            let relativeRequest = (0, _path).relative(config1.context, entryData.absolutePagePath);
                            if (!(0, _path).isAbsolute(relativeRequest) && !relativeRequest.startsWith("../")) {
                                relativeRequest = `./${relativeRequest}`;
                            }
                            entrypoints[bundlePath] = (0, _entries).finalizeEntrypoint({
                                compilerType: "server",
                                name: bundlePath,
                                isServerComponent,
                                value: this.appDir && bundlePath.startsWith("app/") ? (0, _entries).getAppEntry({
                                    name: bundlePath,
                                    appPaths: entryData.appPaths,
                                    pagePath: _path.posix.join(_constants.APP_DIR_ALIAS, (0, _path).relative(this.appDir, entryData.absolutePagePath).replace(/\\/g, "/")),
                                    appDir: this.appDir,
                                    pageExtensions: this.config.pageExtensions
                                }) : relativeRequest,
                                appDir: this.config.experimental.appDir
                            });
                        }
                    });
                }));
                return entrypoints;
            };
        }
        // Enable building of client compilation before server compilation in development
        // @ts-ignore webpack 5
        this.activeConfigs.parallelism = 1;
        this.multiCompiler = (0, _webpack).webpack(this.activeConfigs);
        (0, _output).watchCompilers(this.multiCompiler.compilers[0], this.multiCompiler.compilers[1], this.multiCompiler.compilers[2]);
        // Watch for changes to client/server page files so we can tell when just
        // the server file changes and trigger a reload for GS(S)P pages
        const changedClientPages = new Set();
        const changedServerPages = new Set();
        const changedEdgeServerPages = new Set();
        const changedCSSImportPages = new Set();
        const prevClientPageHashes = new Map();
        const prevServerPageHashes = new Map();
        const prevEdgeServerPageHashes = new Map();
        const prevCSSImportModuleHashes = new Map();
        const trackPageChanges = (pageHashMap, changedItems)=>{
            return (stats)=>{
                try {
                    stats.entrypoints.forEach((entry, key)=>{
                        if (key.startsWith("pages/") || key.startsWith("app/") || (0, _utils).isMiddlewareFilename(key)) {
                            // TODO this doesn't handle on demand loaded chunks
                            entry.chunks.forEach((chunk)=>{
                                if (chunk.id === key) {
                                    const modsIterable = stats.chunkGraph.getChunkModulesIterable(chunk);
                                    let hasCSSModuleChanges = false;
                                    let chunksHash = new _webpack.StringXor();
                                    modsIterable.forEach((mod)=>{
                                        if (mod.resource && mod.resource.replace(/\\/g, "/").includes(key)) {
                                            // use original source to calculate hash since mod.hash
                                            // includes the source map in development which changes
                                            // every time for both server and client so we calculate
                                            // the hash without the source map for the page module
                                            const hash = require("crypto").createHash("sha256").update(mod.originalSource().buffer()).digest().toString("hex");
                                            chunksHash.add(hash);
                                        } else {
                                            var ref;
                                            // for non-pages we can use the module hash directly
                                            const hash = stats.chunkGraph.getModuleHash(mod, chunk.runtime);
                                            chunksHash.add(hash);
                                            // Both CSS import changes from server and client
                                            // components are tracked.
                                            if (key.startsWith("app/") && ((ref = mod.resource) == null ? void 0 : ref.endsWith(".css"))) {
                                                const prevHash = prevCSSImportModuleHashes.get(mod.resource);
                                                if (prevHash && prevHash !== hash) {
                                                    hasCSSModuleChanges = true;
                                                }
                                                prevCSSImportModuleHashes.set(mod.resource, hash);
                                            }
                                        }
                                    });
                                    const prevHash1 = pageHashMap.get(key);
                                    const curHash = chunksHash.toString();
                                    if (prevHash1 && prevHash1 !== curHash) {
                                        changedItems.add(key);
                                    }
                                    pageHashMap.set(key, curHash);
                                    if (hasCSSModuleChanges) {
                                        changedCSSImportPages.add(key);
                                    }
                                }
                            });
                        }
                    });
                } catch (err) {
                    console.error(err);
                }
            };
        };
        this.multiCompiler.compilers[0].hooks.emit.tap("NextjsHotReloaderForClient", trackPageChanges(prevClientPageHashes, changedClientPages));
        this.multiCompiler.compilers[1].hooks.emit.tap("NextjsHotReloaderForServer", trackPageChanges(prevServerPageHashes, changedServerPages));
        this.multiCompiler.compilers[2].hooks.emit.tap("NextjsHotReloaderForServer", trackPageChanges(prevEdgeServerPageHashes, changedEdgeServerPages));
        // This plugin watches for changes to _document.js and notifies the client side that it should reload the page
        this.multiCompiler.compilers[1].hooks.failed.tap("NextjsHotReloaderForServer", (err)=>{
            this.serverError = err;
            this.serverStats = null;
        });
        this.multiCompiler.compilers[2].hooks.done.tap("NextjsHotReloaderForServer", (stats)=>{
            this.serverError = null;
            this.edgeServerStats = stats;
        });
        this.multiCompiler.compilers[1].hooks.done.tap("NextjsHotReloaderForServer", (stats)=>{
            this.serverError = null;
            this.serverStats = stats;
            if (!this.pagesDir) {
                return;
            }
            const { compilation  } = stats;
            // We only watch `_document` for changes on the server compilation
            // the rest of the files will be triggered by the client compilation
            const documentChunk = compilation.namedChunks.get("pages/_document");
            // If the document chunk can't be found we do nothing
            if (!documentChunk) {
                console.warn("_document.js chunk not found");
                return;
            }
            // Initial value
            if (this.serverPrevDocumentHash === null) {
                this.serverPrevDocumentHash = documentChunk.hash || null;
                return;
            }
            // If _document.js didn't change we don't trigger a reload
            if (documentChunk.hash === this.serverPrevDocumentHash) {
                return;
            }
            // Notify reload to reload the page, as _document.js was changed (different hash)
            this.send("reloadPage");
            this.serverPrevDocumentHash = documentChunk.hash || null;
        });
        this.multiCompiler.hooks.done.tap("NextjsHotReloaderForServer", ()=>{
            const serverOnlyChanges = (0, _utils).difference(changedServerPages, changedClientPages);
            const serverComponentChanges = serverOnlyChanges.filter((key)=>key.startsWith("app/")).concat(Array.from(changedCSSImportPages));
            const pageChanges = serverOnlyChanges.filter((key)=>key.startsWith("pages/"));
            const middlewareChanges = Array.from(changedEdgeServerPages).filter((name)=>(0, _utils).isMiddlewareFilename(name));
            changedClientPages.clear();
            changedServerPages.clear();
            changedEdgeServerPages.clear();
            changedCSSImportPages.clear();
            if (middlewareChanges.length > 0) {
                this.send({
                    event: "middlewareChanges"
                });
            }
            if (pageChanges.length > 0) {
                this.send({
                    event: "serverOnlyChanges",
                    pages: serverOnlyChanges.map((pg)=>(0, _denormalizePagePath).denormalizePagePath(pg.slice("pages".length)))
                });
            }
            if (serverComponentChanges.length > 0) {
                this.send({
                    action: "serverComponentChanges"
                });
            }
        });
        this.multiCompiler.compilers[0].hooks.failed.tap("NextjsHotReloaderForClient", (err)=>{
            this.clientError = err;
            this.clientStats = null;
        });
        this.multiCompiler.compilers[0].hooks.done.tap("NextjsHotReloaderForClient", (stats)=>{
            this.clientError = null;
            this.clientStats = stats;
            const { compilation  } = stats;
            const chunkNames = new Set([
                ...compilation.namedChunks.keys()
            ].filter((name)=>!!(0, _getRouteFromEntrypoint).default(name)));
            if (this.prevChunkNames) {
                // detect chunks which have to be replaced with a new template
                // e.g, pages/index.js <-> pages/_error.js
                const addedPages = diff(chunkNames, this.prevChunkNames);
                const removedPages = diff(this.prevChunkNames, chunkNames);
                if (addedPages.size > 0) {
                    for (const addedPage of addedPages){
                        const page = (0, _getRouteFromEntrypoint).default(addedPage);
                        this.send("addedPage", page);
                    }
                }
                if (removedPages.size > 0) {
                    for (const removedPage of removedPages){
                        const page = (0, _getRouteFromEntrypoint).default(removedPage);
                        this.send("removedPage", page);
                    }
                }
            }
            this.prevChunkNames = chunkNames;
        });
        this.webpackHotMiddleware = new _hotMiddleware.WebpackHotMiddleware(this.multiCompiler.compilers);
        let booted = false;
        this.watcher = await new Promise((resolve)=>{
            var ref;
            const watcher = (ref = this.multiCompiler) == null ? void 0 : ref.watch(// @ts-ignore webpack supports an array of watchOptions when using a multiCompiler
            this.activeConfigs.map((config)=>config.watchOptions), // Errors are handled separately
            (_err)=>{
                if (!booted) {
                    booted = true;
                    resolve(watcher);
                }
            });
        });
        this.onDemandEntries = (0, _onDemandEntryHandler).onDemandEntryHandler({
            multiCompiler: this.multiCompiler,
            pagesDir: this.pagesDir,
            appDir: this.appDir,
            rootDir: this.dir,
            nextConfig: this.config,
            ...this.config.onDemandEntries
        });
        this.interceptors = [
            (0, _middleware).getOverlayMiddleware({
                rootDirectory: this.dir,
                stats: ()=>this.clientStats,
                serverStats: ()=>this.serverStats,
                edgeServerStats: ()=>this.edgeServerStats
            }), 
        ];
        // trigger invalidation to ensure any previous callbacks
        // are handled in the on-demand-entry-handler
        if (!initial) {
            this.invalidate();
        }
    }
    invalidate() {
        var ref;
        return (ref = (0, _onDemandEntryHandler).getInvalidator()) == null ? void 0 : ref.invalidate();
    }
    async stop() {
        await new Promise((resolve, reject)=>{
            this.watcher.close((err)=>err ? reject(err) : resolve(true));
        });
        if (this.fallbackWatcher) {
            await new Promise((resolve, reject)=>{
                this.fallbackWatcher.close((err)=>err ? reject(err) : resolve(true));
            });
        }
        this.multiCompiler = undefined;
    }
    async getCompilationErrors(page) {
        var ref4, ref2, ref3;
        const getErrors = ({ compilation  })=>{
            var ref;
            const failedPages = erroredPages(compilation);
            const normalizedPage = (0, _normalizePathSep).normalizePathSep(page);
            // If there is an error related to the requesting page we display it instead of the first error
            return ((ref = failedPages[normalizedPage]) == null ? void 0 : ref.length) > 0 ? failedPages[normalizedPage] : compilation.errors;
        };
        if (this.clientError || this.serverError) {
            return [
                this.clientError || this.serverError
            ];
        } else if ((ref4 = this.clientStats) == null ? void 0 : ref4.hasErrors()) {
            return getErrors(this.clientStats);
        } else if ((ref2 = this.serverStats) == null ? void 0 : ref2.hasErrors()) {
            return getErrors(this.serverStats);
        } else if ((ref3 = this.edgeServerStats) == null ? void 0 : ref3.hasErrors()) {
            return getErrors(this.edgeServerStats);
        } else {
            return [];
        }
    }
    send(action, ...args) {
        this.webpackHotMiddleware.publish(action && typeof action === "object" ? action : {
            action,
            data: args
        });
    }
    async ensurePage({ page , clientOnly , appPaths  }) {
        var ref;
        // Make sure we don't re-build or dispose prebuilt pages
        if (page !== "/_error" && _constants1.BLOCKED_PAGES.indexOf(page) !== -1) {
            return;
        }
        const error = clientOnly ? this.clientError : this.serverError || this.clientError;
        if (error) {
            return Promise.reject(error);
        }
        return (ref = this.onDemandEntries) == null ? void 0 : ref.ensurePage({
            page,
            clientOnly,
            appPaths
        });
    }
}
exports.default = HotReloader;
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
function diff(a, b) {
    return new Set([
        ...a
    ].filter((v)=>!b.has(v)));
}
const wsServer = new _ws.default.Server({
    noServer: true
});
async function renderScriptError(res, error, { verbose =true  } = {}) {
    // Asks CDNs and others to not to cache the errored page
    res.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
    if (error.code === "ENOENT") {
        res.statusCode = 404;
        res.end("404 - Not Found");
        return;
    }
    if (verbose) {
        console.error(error.stack);
    }
    res.statusCode = 500;
    res.end("500 - Internal Error");
}
function addCorsSupport(req, res) {
    // Only rewrite CORS handling when URL matches a hot-reloader middleware
    if (!req.url.startsWith("/__next")) {
        return {
            preflight: false
        };
    }
    if (!req.headers.origin) {
        return {
            preflight: false
        };
    }
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
    // Based on https://github.com/primus/access-control/blob/4cf1bc0e54b086c91e6aa44fb14966fa5ef7549c/index.js#L158
    if (req.headers["access-control-request-headers"]) {
        res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"]);
    }
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return {
            preflight: true
        };
    }
    return {
        preflight: false
    };
}
const matchNextPageBundleRequest = (0, _pathMatch).getPathMatch("/_next/static/chunks/pages/:path*.js(\\.map|)");
// Recursively look up the issuer till it ends up at the root
function findEntryModule(compilation, issuerModule) {
    const issuer = compilation.moduleGraph.getIssuer(issuerModule);
    if (issuer) {
        return findEntryModule(compilation, issuer);
    }
    return issuerModule;
}
function erroredPages(compilation) {
    const failedPages = {};
    for (const error of compilation.errors){
        if (!error.module) {
            continue;
        }
        const entryModule = findEntryModule(compilation, error.module);
        const { name  } = entryModule;
        if (!name) {
            continue;
        }
        // Only pages have to be reloaded
        const enhancedName = (0, _getRouteFromEntrypoint).default(name);
        if (!enhancedName) {
            continue;
        }
        if (!failedPages[enhancedName]) {
            failedPages[enhancedName] = [];
        }
        failedPages[enhancedName].push(error);
    }
    return failedPages;
}

//# sourceMappingURL=hot-reloader.js.map