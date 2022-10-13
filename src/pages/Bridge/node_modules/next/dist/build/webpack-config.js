"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getBaseWebpackConfig;
exports.getDefineEnv = getDefineEnv;
exports.attachReactRefresh = attachReactRefresh;
exports.resolveExternal = resolveExternal;
exports.nextImageLoaderRegex = exports.NODE_BASE_ESM_RESOLVE_OPTIONS = exports.NODE_ESM_RESOLVE_OPTIONS = exports.NODE_BASE_RESOLVE_OPTIONS = exports.NODE_RESOLVE_OPTIONS = void 0;
var _reactRefreshWebpackPlugin = _interopRequireDefault(require("next/dist/compiled/@next/react-refresh-utils/dist/ReactRefreshWebpackPlugin"));
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _crypto = _interopRequireDefault(require("crypto"));
var _webpack = require("next/dist/compiled/webpack/webpack");
var _path = _interopRequireWildcard(require("path"));
var _escapeRegexp = require("../shared/lib/escape-regexp");
var _constants = require("../lib/constants");
var _fileExists = require("../lib/file-exists");
var _constants1 = require("../shared/lib/constants");
var _utils = require("../shared/lib/utils");
var _entries = require("./entries");
var Log = _interopRequireWildcard(require("./output/log"));
var _config = require("./webpack/config");
var _middlewarePlugin = _interopRequireWildcard(require("./webpack/plugins/middleware-plugin"));
var _buildManifestPlugin = _interopRequireDefault(require("./webpack/plugins/build-manifest-plugin"));
var _jsconfigPathsPlugin = require("./webpack/plugins/jsconfig-paths-plugin");
var _nextDropClientPagePlugin = require("./webpack/plugins/next-drop-client-page-plugin");
var _pagesManifestPlugin = _interopRequireDefault(require("./webpack/plugins/pages-manifest-plugin"));
var _profilingPlugin = require("./webpack/plugins/profiling-plugin");
var _reactLoadablePlugin = require("./webpack/plugins/react-loadable-plugin");
var _serverlessPlugin = require("./webpack/plugins/serverless-plugin");
var _wellknownErrorsPlugin = require("./webpack/plugins/wellknown-errors-plugin");
var _css = require("./webpack/config/blocks/css");
var _copyFilePlugin = require("./webpack/plugins/copy-file-plugin");
var _flightManifestPlugin = require("./webpack/plugins/flight-manifest-plugin");
var _flightClientEntryPlugin = require("./webpack/plugins/flight-client-entry-plugin");
var _browserslist = _interopRequireDefault(require("next/dist/compiled/browserslist"));
var _loadJsconfig = _interopRequireDefault(require("./load-jsconfig"));
var _swc = require("./swc");
var _appBuildManifestPlugin = require("./webpack/plugins/app-build-manifest-plugin");
var _subresourceIntegrityPlugin = require("./webpack/plugins/subresource-integrity-plugin");
async function getBaseWebpackConfig(dir, { buildId , config , compilerType , dev =false , entrypoints , hasReactRoot , isDevFallback =false , pagesDir , reactProductionProfiling =false , rewrites , runWebpackSpan , target =_constants1.COMPILER_NAMES.server , appDir , middlewareMatchers  }) {
    var ref44, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, // allows add JsConfigPathsPlugin to allow hot-reloading
    // if the config is added/removed
    ref10, ref11, ref12, ref13, ref14, ref15, ref16, ref17, ref18, ref19, ref20, ref21, ref22;
    const isClient = compilerType === _constants1.COMPILER_NAMES.client;
    const isEdgeServer = compilerType === _constants1.COMPILER_NAMES.edgeServer;
    const isNodeServer = compilerType === _constants1.COMPILER_NAMES.server;
    const { jsConfig , resolvedBaseUrl  } = await (0, _loadJsconfig).default(dir, config);
    const supportedBrowsers = await getSupportedBrowsers(dir, dev, config);
    const hasRewrites = rewrites.beforeFiles.length > 0 || rewrites.afterFiles.length > 0 || rewrites.fallback.length > 0;
    // Only error in first one compiler (client) once
    if (isClient) {
        if (!hasReactRoot) {
            if (config.experimental.runtime) {
                throw new Error("`experimental.runtime` requires React 18 to be installed.");
            }
            if (config.experimental.serverComponents) {
                throw new Error("`experimental.serverComponents` requires React 18 to be installed.");
            }
        }
        if (!config.experimental.appDir && config.experimental.serverComponents) {
            throw new Error("`experimental.serverComponents` requires experimental.appDir to be enabled.");
        }
    }
    const hasConcurrentFeatures = hasReactRoot;
    const hasServerComponents = hasConcurrentFeatures && !!config.experimental.serverComponents;
    const disableOptimizedLoading = hasConcurrentFeatures ? true : config.experimental.disableOptimizedLoading;
    if (isClient) {
        if (config.experimental.runtime === _constants.SERVER_RUNTIME.edge) {
            Log.warn("You are using the experimental Edge Runtime with `experimental.runtime`.");
        }
        if (config.experimental.runtime === "nodejs") {
            Log.warn("You are using the experimental Node.js Runtime with `experimental.runtime`.");
        }
        if (hasServerComponents) {
            Log.warn("You have experimental React Server Components enabled. Continue at your own risk.");
        }
    }
    const babelConfigFile = await [
        ".babelrc",
        ".babelrc.json",
        ".babelrc.js",
        ".babelrc.mjs",
        ".babelrc.cjs",
        "babel.config.js",
        "babel.config.json",
        "babel.config.mjs",
        "babel.config.cjs", 
    ].reduce(async (memo, filename)=>{
        const configFilePath = _path.default.join(dir, filename);
        return await memo || (await (0, _fileExists).fileExists(configFilePath) ? configFilePath : undefined);
    }, Promise.resolve(undefined));
    const distDir = _path.default.join(dir, config.distDir);
    let useSWCLoader = !babelConfigFile || config.experimental.forceSwcTransforms;
    let SWCBinaryTarget = undefined;
    if (useSWCLoader) {
        var ref23, ref24;
        // TODO: we do not collect wasm target yet
        const binaryTarget = (ref23 = require("./swc")) == null ? void 0 : ref23.getBinaryMetadata == null ? void 0 : (ref24 = ref23.getBinaryMetadata()) == null ? void 0 : ref24.target;
        SWCBinaryTarget = binaryTarget ? [
            `swc/target/${binaryTarget}`,
            true
        ] : undefined;
    }
    if (!loggedSwcDisabled && !useSWCLoader && babelConfigFile) {
        Log.info(`Disabled SWC as replacement for Babel because of custom Babel configuration "${_path.default.relative(dir, babelConfigFile)}" https://nextjs.org/docs/messages/swc-disabled`);
        loggedSwcDisabled = true;
    }
    // eagerly load swc bindings instead of waiting for transform calls
    if (!babelConfigFile && isClient) {
        await (0, _swc).loadBindings();
    }
    if (!loggedIgnoredCompilerOptions && !useSWCLoader && config.compiler) {
        Log.info("`compiler` options in `next.config.js` will be ignored while using Babel https://nextjs.org/docs/messages/ignored-compiler-options");
        loggedIgnoredCompilerOptions = true;
    }
    const getBabelOrSwcLoader = ()=>{
        var ref;
        if (useSWCLoader && (config == null ? void 0 : (ref = config.experimental) == null ? void 0 : ref.swcTraceProfiling)) {
            var // This will init subscribers once only in a single process lifecycle,
            // even though it can be called multiple times.
            // Subscriber need to be initialized _before_ any actual swc's call (transform, etcs)
            // to collect correct trace spans when they are called.
            ref42;
            (ref42 = require("./swc")) == null ? void 0 : ref42.initCustomTraceSubscriber == null ? void 0 : ref42.initCustomTraceSubscriber(_path.default.join(distDir, `swc-trace-profile-${Date.now()}.json`));
        }
        var ref43;
        return useSWCLoader ? {
            loader: "next-swc-loader",
            options: {
                isServer: isNodeServer || isEdgeServer,
                pagesDir,
                hasReactRefresh: dev && isClient,
                fileReading: config.experimental.swcFileReading,
                nextConfig: config,
                jsConfig,
                supportedBrowsers: config.experimental.browsersListForSwc ? supportedBrowsers : undefined,
                swcCacheDir: _path.default.join(dir, (ref43 = config == null ? void 0 : config.distDir) != null ? ref43 : ".next", "cache", "swc")
            }
        } : {
            loader: require.resolve("./babel/loader/index"),
            options: {
                configFile: babelConfigFile,
                isServer: isNodeServer || isEdgeServer,
                distDir,
                pagesDir,
                cwd: dir,
                development: dev,
                hasReactRefresh: dev && isClient,
                hasJsxRuntime: true
            }
        };
    };
    const defaultLoaders = {
        babel: getBabelOrSwcLoader()
    };
    const pageExtensions = config.pageExtensions;
    const babelIncludeRegexes = [
        /next[\\/]dist[\\/]shared[\\/]lib/,
        /next[\\/]dist[\\/]client/,
        /next[\\/]dist[\\/]pages/,
        /[\\/](strip-ansi|ansi-regex)[\\/]/,
        /styled-jsx[\\/]/, 
    ];
    // Support for NODE_PATH
    const nodePathList = (process.env.NODE_PATH || "").split(process.platform === "win32" ? ";" : ":").filter((p)=>!!p);
    // Intentionally not using isTargetLikeServerless helper
    const isLikeServerless = target === "serverless" || target === "experimental-serverless-trace";
    const outputPath = isNodeServer || isEdgeServer ? _path.default.join(distDir, isLikeServerless ? _constants1.SERVERLESS_DIRECTORY : _constants1.SERVER_DIRECTORY) : distDir;
    const clientEntries = isClient ? {
        // Backwards compatibility
        "main.js": [],
        ...dev ? {
            [_constants1.CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH]: require.resolve(`next/dist/compiled/@next/react-refresh-utils/dist/runtime`),
            [_constants1.CLIENT_STATIC_FILES_RUNTIME_AMP]: `./` + (0, _path).relative(dir, (0, _path).join(NEXT_PROJECT_ROOT_DIST_CLIENT, "dev", "amp-dev")).replace(/\\/g, "/")
        } : {},
        [_constants1.CLIENT_STATIC_FILES_RUNTIME_MAIN]: `./` + _path.default.relative(dir, _path.default.join(NEXT_PROJECT_ROOT_DIST_CLIENT, dev ? `next-dev.js` : "next.js")).replace(/\\/g, "/"),
        ...config.experimental.appDir ? {
            [_constants1.CLIENT_STATIC_FILES_RUNTIME_MAIN_APP]: dev ? [
                require.resolve(`next/dist/compiled/@next/react-refresh-utils/dist/runtime`),
                `./` + _path.default.relative(dir, _path.default.join(NEXT_PROJECT_ROOT_DIST_CLIENT, "app-next-dev.js")).replace(/\\/g, "/"), 
            ] : `./` + _path.default.relative(dir, _path.default.join(NEXT_PROJECT_ROOT_DIST_CLIENT, "app-next.js")).replace(/\\/g, "/")
        } : {}
    } : undefined;
    function getReactProfilingInProduction() {
        if (reactProductionProfiling) {
            return {
                "react-dom$": "react-dom/profiling",
                "scheduler/tracing": "scheduler/tracing-profiling"
            };
        }
    }
    // tell webpack where to look for _app and _document
    // using aliases to allow falling back to the default
    // version when removed or not present
    const clientResolveRewrites = require.resolve("../shared/lib/router/utils/resolve-rewrites");
    const customAppAliases = {};
    const customErrorAlias = {};
    const customDocumentAliases = {};
    const customRootAliases = {};
    if (dev) {
        customAppAliases[`${_constants.PAGES_DIR_ALIAS}/_app`] = [
            ...pagesDir ? pageExtensions.reduce((prev, ext)=>{
                prev.push(_path.default.join(pagesDir, `_app.${ext}`));
                return prev;
            }, []) : [],
            "next/dist/pages/_app.js", 
        ];
        customAppAliases[`${_constants.PAGES_DIR_ALIAS}/_error`] = [
            ...pagesDir ? pageExtensions.reduce((prev, ext)=>{
                prev.push(_path.default.join(pagesDir, `_error.${ext}`));
                return prev;
            }, []) : [],
            "next/dist/pages/_error.js", 
        ];
        customDocumentAliases[`${_constants.PAGES_DIR_ALIAS}/_document`] = [
            ...pagesDir ? pageExtensions.reduce((prev, ext)=>{
                prev.push(_path.default.join(pagesDir, `_document.${ext}`));
                return prev;
            }, []) : [],
            `next/dist/pages/_document.js`, 
        ];
    }
    const reactDir = (0, _path).dirname(require.resolve("react/package.json"));
    const reactDomDir = (0, _path).dirname(require.resolve("react-dom/package.json"));
    const mainFieldsPerCompiler = {
        [_constants1.COMPILER_NAMES.server]: [
            "main",
            "module"
        ],
        [_constants1.COMPILER_NAMES.client]: [
            "browser",
            "module",
            "main"
        ],
        [_constants1.COMPILER_NAMES.edgeServer]: [
            "browser",
            "module",
            "main"
        ]
    };
    const resolveConfig = {
        // Disable .mjs for node_modules bundling
        extensions: isNodeServer ? [
            ".js",
            ".mjs",
            ".tsx",
            ".ts",
            ".jsx",
            ".json",
            ".wasm"
        ] : [
            ".mjs",
            ".js",
            ".tsx",
            ".ts",
            ".jsx",
            ".json",
            ".wasm"
        ],
        modules: [
            "node_modules",
            ...nodePathList
        ],
        alias: {
            next: NEXT_PROJECT_ROOT,
            react: `${reactDir}`,
            "react-dom$": `${reactDomDir}`,
            "react-dom/server$": `${reactDomDir}/server`,
            "react-dom/server.browser$": `${reactDomDir}/server.browser`,
            "react-dom/client$": `${reactDomDir}/client`,
            "styled-jsx/style$": require.resolve(`styled-jsx/style`),
            "styled-jsx$": require.resolve(`styled-jsx`),
            ...customAppAliases,
            ...customErrorAlias,
            ...customDocumentAliases,
            ...customRootAliases,
            ...pagesDir ? {
                [_constants.PAGES_DIR_ALIAS]: pagesDir
            } : {},
            ...appDir ? {
                [_constants.APP_DIR_ALIAS]: appDir
            } : {},
            [_constants.ROOT_DIR_ALIAS]: dir,
            [_constants.DOT_NEXT_ALIAS]: distDir,
            ...isClient || isEdgeServer ? getOptimizedAliases() : {},
            ...getReactProfilingInProduction(),
            [_constants.RSC_MOD_REF_PROXY_ALIAS]: "next/dist/build/webpack/loaders/next-flight-loader/module-proxy",
            ...isClient || isEdgeServer ? {
                [clientResolveRewrites]: hasRewrites ? clientResolveRewrites : false
            } : {},
            "@swc/helpers": _path.default.dirname(require.resolve("@swc/helpers/package.json")),
            setimmediate: "next/dist/compiled/setimmediate"
        },
        ...isClient || isEdgeServer ? {
            fallback: {
                process: require.resolve("./polyfills/process")
            }
        } : undefined,
        mainFields: mainFieldsPerCompiler[compilerType],
        plugins: []
    };
    const terserOptions = {
        parse: {
            ecma: 8
        },
        compress: {
            ecma: 5,
            warnings: false,
            // The following two options are known to break valid JavaScript code
            comparisons: false,
            inline: 2
        },
        mangle: {
            safari10: true
        },
        output: {
            ecma: 5,
            safari10: true,
            comments: false,
            // Fixes usage of Emoji and certain Regex
            ascii_only: true
        }
    };
    const isModuleCSS = (module)=>{
        return(// mini-css-extract-plugin
        module.type === `css/mini-extract` || // extract-css-chunks-webpack-plugin (old)
        module.type === `css/extract-chunks` || // extract-css-chunks-webpack-plugin (new)
        module.type === `css/extract-css-chunks`);
    };
    // Packages which will be split into the 'framework' chunk.
    // Only top-level packages are included, e.g. nested copies like
    // 'node_modules/meow/node_modules/object-assign' are not included.
    const topLevelFrameworkPaths = [];
    const visitedFrameworkPackages = new Set();
    // Adds package-paths of dependencies recursively
    const addPackagePath = (packageName, relativeToPath)=>{
        try {
            if (visitedFrameworkPackages.has(packageName)) {
                return;
            }
            visitedFrameworkPackages.add(packageName);
            const packageJsonPath = require.resolve(`${packageName}/package.json`, {
                paths: [
                    relativeToPath
                ]
            });
            // Include a trailing slash so that a `.startsWith(packagePath)` check avoids false positives
            // when one package name starts with the full name of a different package.
            // For example:
            //   "node_modules/react-slider".startsWith("node_modules/react")  // true
            //   "node_modules/react-slider".startsWith("node_modules/react/") // false
            const directory = _path.default.join(packageJsonPath, "../");
            // Returning from the function in case the directory has already been added and traversed
            if (topLevelFrameworkPaths.includes(directory)) return;
            topLevelFrameworkPaths.push(directory);
            const dependencies = require(packageJsonPath).dependencies || {};
            for (const name of Object.keys(dependencies)){
                addPackagePath(name, directory);
            }
        } catch (_) {
        // don't error on failing to resolve framework packages
        }
    };
    for (const packageName1 of [
        "react",
        "react-dom"
    ]){
        addPackagePath(packageName1, dir);
    }
    const crossOrigin = config.crossOrigin;
    const looseEsmExternals = ((ref44 = config.experimental) == null ? void 0 : ref44.esmExternals) === "loose";
    async function handleExternals(context, request, dependencyType, getResolve) {
        // We need to externalize internal requests for files intended to
        // not be bundled.
        const isLocal = request.startsWith(".") || // Always check for unix-style path, as webpack sometimes
        // normalizes as posix.
        _path.default.posix.isAbsolute(request) || // When on Windows, we also want to check for Windows-specific
        // absolute paths.
        (process.platform === "win32" && _path.default.win32.isAbsolute(request));
        // make sure import "next" shows a warning when imported
        // in pages/components
        if (request === "next") {
            return `commonjs next/dist/lib/import-next-warning`;
        }
        // Relative requires don't need custom resolution, because they
        // are relative to requests we've already resolved here.
        // Absolute requires (require('/foo')) are extremely uncommon, but
        // also have no need for customization as they're already resolved.
        if (!isLocal) {
            // styled-jsx is also marked as externals here to avoid being
            // bundled in client components for RSC.
            if (/^(?:next$|styled-jsx$|react(?:$|\/))/.test(request)) {
                return `commonjs ${request}`;
            }
            const notExternalModules = /^(?:private-next-pages\/|next\/(?:dist\/pages\/|(?:app|document|link|image|future\/image|constants|dynamic|script)$)|string-hash|private-next-rsc-mod-ref-proxy$)/;
            if (notExternalModules.test(request)) {
                return;
            }
        }
        // @swc/helpers should not be external as it would
        // require hoisting the package which we can't rely on
        if (request.includes("@swc/helpers")) {
            return;
        }
        // When in esm externals mode, and using import, we resolve with
        // ESM resolving options.
        const isEsmRequested = dependencyType === "esm";
        const isLocalCallback = (localRes)=>{
            // Makes sure dist/shared and dist/server are not bundled
            // we need to process shared `router/router` and `dynamic`,
            // so that the DefinePlugin can inject process.env values
            const isNextExternal = /next[/\\]dist[/\\](shared|server)[/\\](?!lib[/\\](router[/\\]router|dynamic))/.test(localRes);
            if (isNextExternal) {
                // Generate Next.js external import
                const externalRequest = _path.default.posix.join("next", "dist", _path.default.relative(// Root of Next.js package:
                _path.default.join(__dirname, ".."), localRes)// Windows path normalization
                .replace(/\\/g, "/"));
                return `commonjs ${externalRequest}`;
            } else {
                // We don't want to retry local requests
                // with other preferEsm options
                return;
            }
        };
        const resolveResult = await resolveExternal(dir, config.experimental.esmExternals, context, request, isEsmRequested, getResolve, isLocal ? isLocalCallback : undefined);
        if ("localRes" in resolveResult) {
            return resolveResult.localRes;
        }
        // Forcedly resolve the styled-jsx installed by next.js,
        // since `resolveExternal` cannot find the styled-jsx dep with pnpm
        if (request === "styled-jsx/style") {
            resolveResult.res = require.resolve(request);
        }
        const { res , isEsm  } = resolveResult;
        // If the request cannot be resolved we need to have
        // webpack "bundle" it so it surfaces the not found error.
        if (!res) {
            return;
        }
        // ESM externals can only be imported (and not required).
        // Make an exception in loose mode.
        if (!isEsmRequested && isEsm && !looseEsmExternals) {
            throw new Error(`ESM packages (${request}) need to be imported. Use 'import' to reference the package instead. https://nextjs.org/docs/messages/import-esm-externals`);
        }
        const externalType = isEsm ? "module" : "commonjs";
        if (res.match(/next[/\\]dist[/\\]shared[/\\](?!lib[/\\]router[/\\]router)/) || res.match(/next[/\\]dist[/\\]compiled[/\\].*\.[mc]?js$/)) {
            return `${externalType} ${request}`;
        }
        // Default pages have to be transpiled
        if (res.match(/[/\\]next[/\\]dist[/\\]/) || // This is the @babel/plugin-transform-runtime "helpers: true" option
        res.match(/node_modules[/\\]@babel[/\\]runtime[/\\]/)) {
            return;
        }
        // Webpack itself has to be compiled because it doesn't always use module relative paths
        if (res.match(/node_modules[/\\]webpack/) || res.match(/node_modules[/\\]css-loader/)) {
            return;
        }
        // Anything else that is standard JavaScript within `node_modules`
        // can be externalized.
        if (/node_modules[/\\].*\.[mc]?js$/.test(res)) {
            return `${externalType} ${request}`;
        }
    // Default behavior: bundle the code!
    }
    const codeCondition = {
        test: /\.(tsx|ts|js|cjs|mjs|jsx)$/,
        ...config.experimental.externalDir ? {} : {
            include: [
                dir,
                ...babelIncludeRegexes
            ]
        },
        exclude: (excludePath)=>{
            if (babelIncludeRegexes.some((r)=>r.test(excludePath))) {
                return false;
            }
            return /node_modules/.test(excludePath);
        }
    };
    const rscSharedRegex = /(node_modules\/react\/|\/shared\/lib\/(head-manager-context|router-context|flush-effects)\.js|node_modules\/styled-jsx\/)/;
    let webpackConfig = {
        parallelism: Number(process.env.NEXT_WEBPACK_PARALLELISM) || undefined,
        // @ts-ignore
        externals: isClient || isEdgeServer ? // bundles in case a user imported types and it wasn't removed
        // TODO: should we warn/error for this instead?
        [
            "next",
            ...isEdgeServer ? [
                {
                    "@builder.io/partytown": "{}",
                    "next/dist/compiled/etag": "{}",
                    "next/dist/compiled/chalk": "{}",
                    "react-dom": "{}"
                },
                _middlewarePlugin.handleWebpackExtenalForEdgeRuntime, 
            ] : [], 
        ] : target !== "serverless" ? [
            ({ context , request , dependencyType , getResolve  })=>{
                return handleExternals(context, request, dependencyType, (options)=>{
                    const resolveFunction = getResolve(options);
                    return (resolveContext, requestToResolve)=>{
                        return new Promise((resolve, reject)=>{
                            resolveFunction(resolveContext, requestToResolve, (err, result, resolveData)=>{
                                var ref;
                                if (err) return reject(err);
                                if (!result) return resolve([
                                    null,
                                    false
                                ]);
                                const isEsm = /\.js$/i.test(result) ? (resolveData == null ? void 0 : (ref = resolveData.descriptionFileData) == null ? void 0 : ref.type) === "module" : /\.mjs$/i.test(result);
                                resolve([
                                    result,
                                    isEsm
                                ]);
                            });
                        });
                    };
                });
            }, 
        ] : [
            // When the 'serverless' target is used all node_modules will be compiled into the output bundles
            // So that the 'serverless' bundles have 0 runtime dependencies
            "next/dist/compiled/@ampproject/toolbox-optimizer",
            // Mark this as external if not enabled so it doesn't cause a
            // webpack error from being missing
            ...config.experimental.optimizeCss ? [] : [
                "critters"
            ], 
        ],
        optimization: {
            // @ts-ignore: TODO remove ts-ignore when webpack 4 is removed
            emitOnErrors: !dev,
            checkWasmTypes: false,
            nodeEnv: false,
            ...hasServerComponents ? {
                // We have to use the names here instead of hashes to ensure the consistency between compilers.
                moduleIds: isClient ? "deterministic" : "named"
            } : {},
            splitChunks: (()=>{
                // For the edge runtime, we have to bundle all dependencies inside without dynamic `require`s.
                // To make some dependencies like `react` to be shared between entrypoints, we use a special
                // cache group here even under dev mode.
                const edgeRSCCacheGroups = hasServerComponents ? {
                    rscDeps: {
                        enforce: true,
                        name: "rsc-runtime-deps",
                        filename: "rsc-runtime-deps.js",
                        test: rscSharedRegex
                    }
                } : undefined;
                if (isEdgeServer && edgeRSCCacheGroups) {
                    return {
                        cacheGroups: edgeRSCCacheGroups
                    };
                }
                if (dev) {
                    return false;
                }
                if (isNodeServer) {
                    return {
                        // @ts-ignore
                        filename: "[name].js",
                        chunks: "all",
                        minSize: 1000
                    };
                }
                if (isEdgeServer) {
                    return {
                        // @ts-ignore
                        filename: "edge-chunks/[name].js",
                        chunks: "all",
                        minChunks: 2,
                        cacheGroups: edgeRSCCacheGroups
                    };
                }
                return {
                    // Keep main and _app chunks unsplitted in webpack 5
                    // as we don't need a separate vendor chunk from that
                    // and all other chunk depend on them so there is no
                    // duplication that need to be pulled out.
                    chunks: (chunk)=>!/^(polyfills|main|pages\/_app)$/.test(chunk.name),
                    cacheGroups: {
                        framework: {
                            chunks: "all",
                            name: "framework",
                            test (module) {
                                const resource = module.nameForCondition == null ? void 0 : module.nameForCondition();
                                return resource ? topLevelFrameworkPaths.some((pkgPath)=>resource.startsWith(pkgPath)) : false;
                            },
                            priority: 40,
                            // Don't let webpack eliminate this chunk (prevents this chunk from
                            // becoming a part of the commons chunk)
                            enforce: true
                        },
                        lib: {
                            test (module) {
                                return module.size() > 160000 && /node_modules[/\\]/.test(module.nameForCondition() || "");
                            },
                            name (module) {
                                const hash = _crypto.default.createHash("sha1");
                                if (isModuleCSS(module)) {
                                    module.updateHash(hash);
                                } else {
                                    if (!module.libIdent) {
                                        throw new Error(`Encountered unknown module type: ${module.type}. Please open an issue.`);
                                    }
                                    hash.update(module.libIdent({
                                        context: dir
                                    }));
                                }
                                return hash.digest("hex").substring(0, 8);
                            },
                            priority: 30,
                            minChunks: 1,
                            reuseExistingChunk: true
                        }
                    },
                    maxInitialRequests: 25,
                    minSize: 20000
                };
            })(),
            runtimeChunk: isClient ? {
                name: _constants1.CLIENT_STATIC_FILES_RUNTIME_WEBPACK
            } : undefined,
            minimize: !dev && isClient,
            minimizer: [
                // Minify JavaScript
                (compiler)=>{
                    var ref, ref45;
                    // @ts-ignore No typings yet
                    const { TerserPlugin ,  } = require("./webpack/plugins/terser-webpack-plugin/src/index.js");
                    var ref46, ref47;
                    new TerserPlugin({
                        cacheDir: _path.default.join(distDir, "cache", "next-minifier"),
                        parallel: config.experimental.cpus,
                        swcMinify: config.swcMinify,
                        terserOptions: {
                            ...terserOptions,
                            compress: {
                                ...terserOptions.compress,
                                ...(ref46 = (ref = config.experimental.swcMinifyDebugOptions) == null ? void 0 : ref.compress) != null ? ref46 : {}
                            },
                            mangle: {
                                ...terserOptions.mangle,
                                ...(ref47 = (ref45 = config.experimental.swcMinifyDebugOptions) == null ? void 0 : ref45.mangle) != null ? ref47 : {}
                            }
                        }
                    }).apply(compiler);
                },
                // Minify CSS
                (compiler)=>{
                    const { CssMinimizerPlugin ,  } = require("./webpack/plugins/css-minimizer-plugin");
                    new CssMinimizerPlugin({
                        postcssOptions: {
                            map: {
                                // `inline: false` generates the source map in a separate file.
                                // Otherwise, the CSS file is needlessly large.
                                inline: false,
                                // `annotation: false` skips appending the `sourceMappingURL`
                                // to the end of the CSS file. Webpack already handles this.
                                annotation: false
                            }
                        }
                    }).apply(compiler);
                }, 
            ]
        },
        context: dir,
        // Kept as function to be backwards compatible
        // @ts-ignore TODO webpack 5 typings needed
        entry: async ()=>{
            return {
                ...clientEntries ? clientEntries : {},
                ...entrypoints
            };
        },
        watchOptions,
        output: {
            // we must set publicPath to an empty value to override the default of
            // auto which doesn't work in IE11
            publicPath: `${config.assetPrefix || ""}/_next/`,
            path: !dev && isNodeServer ? _path.default.join(outputPath, "chunks") : outputPath,
            // On the server we don't use hashes
            filename: isNodeServer || isEdgeServer ? dev || isEdgeServer ? `[name].js` : `../[name].js` : `static/chunks/${isDevFallback ? "fallback/" : ""}[name]${dev ? "" : appDir ? "-[chunkhash]" : "-[contenthash]"}.js`,
            library: isClient || isEdgeServer ? "_N_E" : undefined,
            libraryTarget: isClient || isEdgeServer ? "assign" : "commonjs2",
            hotUpdateChunkFilename: "static/webpack/[id].[fullhash].hot-update.js",
            hotUpdateMainFilename: "static/webpack/[fullhash].[runtime].hot-update.json",
            // This saves chunks with the name given via `import()`
            chunkFilename: isNodeServer || isEdgeServer ? "[name].js" : `static/chunks/${isDevFallback ? "fallback/" : ""}${dev ? "[name]" : "[name].[contenthash]"}.js`,
            strictModuleExceptionHandling: true,
            crossOriginLoading: crossOrigin,
            webassemblyModuleFilename: "static/wasm/[modulehash].wasm",
            hashFunction: "xxhash64",
            hashDigestLength: 16
        },
        performance: false,
        resolve: resolveConfig,
        resolveLoader: {
            // The loaders Next.js provides
            alias: [
                "error-loader",
                "next-swc-loader",
                "next-client-pages-loader",
                "next-image-loader",
                "next-serverless-loader",
                "next-style-loader",
                "next-flight-loader",
                "next-flight-client-entry-loader",
                "noop-loader",
                "next-middleware-loader",
                "next-edge-function-loader",
                "next-edge-ssr-loader",
                "next-middleware-asset-loader",
                "next-middleware-wasm-loader",
                "next-app-loader", 
            ].reduce((alias, loader)=>{
                // using multiple aliases to replace `resolveLoader.modules`
                alias[loader] = _path.default.join(__dirname, "webpack", "loaders", loader);
                return alias;
            }, {}),
            modules: [
                "node_modules",
                ...nodePathList
            ],
            plugins: []
        },
        module: {
            rules: [
                // TODO: FIXME: do NOT webpack 5 support with this
                // x-ref: https://github.com/webpack/webpack/issues/11467
                ...!config.experimental.fullySpecified ? [
                    {
                        test: /\.m?js/,
                        resolve: {
                            fullySpecified: false
                        }
                    }, 
                ] : [],
                ...hasServerComponents && (isNodeServer || isEdgeServer) ? [
                    // RSC server compilation loaders
                    {
                        test: codeCondition.test,
                        include: [
                            dir,
                            // To let the internal client components passing through flight loader
                            /next[\\/]dist/, 
                        ],
                        issuerLayer: _constants.WEBPACK_LAYERS.server,
                        use: {
                            loader: "next-flight-loader"
                        }
                    }, 
                ] : [],
                ...hasServerComponents && isEdgeServer ? [
                    // Move shared dependencies from sc_server and sc_client into the
                    // same layer.
                    {
                        test: rscSharedRegex,
                        layer: _constants.WEBPACK_LAYERS.rscShared
                    }, 
                ] : [],
                {
                    test: /\.(js|cjs|mjs)$/,
                    issuerLayer: _constants.WEBPACK_LAYERS.api,
                    parser: {
                        // Switch back to normal URL handling
                        url: true
                    }
                },
                {
                    oneOf: [
                        {
                            ...codeCondition,
                            issuerLayer: _constants.WEBPACK_LAYERS.api,
                            parser: {
                                // Switch back to normal URL handling
                                url: true
                            },
                            use: defaultLoaders.babel
                        },
                        {
                            ...codeCondition,
                            issuerLayer: _constants.WEBPACK_LAYERS.middleware,
                            use: getBabelOrSwcLoader()
                        },
                        ...hasServerComponents ? [
                            {
                                test: codeCondition.test,
                                issuerLayer: _constants.WEBPACK_LAYERS.server,
                                use: {
                                    ...defaultLoaders.babel,
                                    options: {
                                        ...defaultLoaders.babel.options,
                                        isServerLayer: true
                                    }
                                }
                            }, 
                        ] : [],
                        {
                            ...codeCondition,
                            use: dev && isClient ? [
                                require.resolve("next/dist/compiled/@next/react-refresh-utils/dist/loader"),
                                defaultLoaders.babel, 
                            ] : defaultLoaders.babel
                        }, 
                    ]
                },
                ...!config.images.disableStaticImages ? [
                    {
                        test: nextImageLoaderRegex,
                        loader: "next-image-loader",
                        issuer: {
                            not: _css.regexLikeCss
                        },
                        dependency: {
                            not: [
                                "url"
                            ]
                        },
                        options: {
                            isServer: isNodeServer || isEdgeServer,
                            isDev: dev,
                            basePath: config.basePath,
                            assetPrefix: config.assetPrefix
                        }
                    }, 
                ] : [],
                ...isEdgeServer || isClient ? [
                    {
                        oneOf: [
                            {
                                issuerLayer: _constants.WEBPACK_LAYERS.middleware,
                                resolve: {
                                    fallback: {
                                        process: require.resolve("./polyfills/process")
                                    }
                                }
                            },
                            {
                                resolve: {
                                    fallback: config.experimental.fallbackNodePolyfills === false ? {
                                        assert: false,
                                        buffer: false,
                                        constants: false,
                                        crypto: false,
                                        domain: false,
                                        http: false,
                                        https: false,
                                        os: false,
                                        path: false,
                                        punycode: false,
                                        process: false,
                                        querystring: false,
                                        stream: false,
                                        string_decoder: false,
                                        sys: false,
                                        timers: false,
                                        tty: false,
                                        util: false,
                                        vm: false,
                                        zlib: false,
                                        events: false,
                                        setImmediate: false
                                    } : {
                                        assert: require.resolve("next/dist/compiled/assert"),
                                        buffer: require.resolve("next/dist/compiled/buffer/"),
                                        constants: require.resolve("next/dist/compiled/constants-browserify"),
                                        crypto: require.resolve("next/dist/compiled/crypto-browserify"),
                                        domain: require.resolve("next/dist/compiled/domain-browser"),
                                        http: require.resolve("next/dist/compiled/stream-http"),
                                        https: require.resolve("next/dist/compiled/https-browserify"),
                                        os: require.resolve("next/dist/compiled/os-browserify"),
                                        path: require.resolve("next/dist/compiled/path-browserify"),
                                        punycode: require.resolve("next/dist/compiled/punycode"),
                                        process: require.resolve("./polyfills/process"),
                                        // Handled in separate alias
                                        querystring: require.resolve("next/dist/compiled/querystring-es3"),
                                        stream: require.resolve("next/dist/compiled/stream-browserify"),
                                        string_decoder: require.resolve("next/dist/compiled/string_decoder"),
                                        sys: require.resolve("next/dist/compiled/util/"),
                                        timers: require.resolve("next/dist/compiled/timers-browserify"),
                                        tty: require.resolve("next/dist/compiled/tty-browserify"),
                                        // Handled in separate alias
                                        // url: require.resolve('url/'),
                                        util: require.resolve("next/dist/compiled/util/"),
                                        vm: require.resolve("next/dist/compiled/vm-browserify"),
                                        zlib: require.resolve("next/dist/compiled/browserify-zlib"),
                                        events: require.resolve("next/dist/compiled/events/"),
                                        setImmediate: require.resolve("next/dist/compiled/setimmediate")
                                    }
                                }
                            }, 
                        ]
                    }, 
                ] : [], 
            ].filter(Boolean)
        },
        plugins: [
            dev && isClient && new _reactRefreshWebpackPlugin.default(_webpack.webpack),
            // Makes sure `Buffer` and `process` are polyfilled in client and flight bundles (same behavior as webpack 4)
            (isClient || isEdgeServer) && new _webpack.webpack.ProvidePlugin({
                // Buffer is used by getInlineScriptSource
                Buffer: [
                    require.resolve("buffer"),
                    "Buffer"
                ],
                // Avoid process being overridden when in web run time
                ...isClient && {
                    process: [
                        require.resolve("process")
                    ]
                }
            }),
            new _webpack.webpack.DefinePlugin(getDefineEnv({
                dev,
                config,
                distDir,
                isClient,
                hasRewrites,
                hasReactRoot,
                isNodeServer,
                isEdgeServer,
                middlewareMatchers
            })),
            isClient && new _reactLoadablePlugin.ReactLoadablePlugin({
                filename: _constants1.REACT_LOADABLE_MANIFEST,
                pagesDir,
                runtimeAsset: hasConcurrentFeatures ? `server/${_constants1.MIDDLEWARE_REACT_LOADABLE_MANIFEST}.js` : undefined,
                dev
            }),
            (isClient || isEdgeServer) && new _nextDropClientPagePlugin.DropClientPage(),
            config.outputFileTracing && !isLikeServerless && (isNodeServer || isEdgeServer) && !dev && new (require("./webpack/plugins/next-trace-entrypoints-plugin")).TraceEntryPointsPlugin({
                appDir: dir,
                esmExternals: config.experimental.esmExternals,
                staticImageImports: !config.images.disableStaticImages,
                outputFileTracingRoot: config.experimental.outputFileTracingRoot
            }),
            // Moment.js is an extremely popular library that bundles large locale files
            // by default due to how Webpack interprets its code. This is a practical
            // solution that requires the user to opt into importing specific locales.
            // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
            config.excludeDefaultMomentLocales && new _webpack.webpack.IgnorePlugin({
                resourceRegExp: /^\.\/locale$/,
                contextRegExp: /moment$/
            }),
            ...dev ? (()=>{
                // Even though require.cache is server only we have to clear assets from both compilations
                // This is because the client compilation generates the build manifest that's used on the server side
                const { NextJsRequireCacheHotReloader ,  } = require("./webpack/plugins/nextjs-require-cache-hot-reloader");
                const devPlugins = [
                    new NextJsRequireCacheHotReloader({
                        hasServerComponents: config.experimental.serverComponents
                    }), 
                ];
                if (isClient || isEdgeServer) {
                    devPlugins.push(new _webpack.webpack.HotModuleReplacementPlugin());
                }
                return devPlugins;
            })() : [],
            !dev && new _webpack.webpack.IgnorePlugin({
                resourceRegExp: /react-is/,
                contextRegExp: /next[\\/]dist[\\/]/
            }),
            target === "serverless" && (isNodeServer || isEdgeServer) && new _serverlessPlugin.ServerlessPlugin(),
            (isNodeServer || isEdgeServer) && new _pagesManifestPlugin.default({
                serverless: isLikeServerless,
                dev,
                isEdgeRuntime: isEdgeServer,
                appDirEnabled: !!config.experimental.appDir
            }),
            // MiddlewarePlugin should be after DefinePlugin so  NEXT_PUBLIC_*
            // replacement is done before its process.env.* handling
            isEdgeServer && new _middlewarePlugin.default({
                dev,
                sriEnabled: !dev && !!((ref1 = config.experimental.sri) == null ? void 0 : ref1.algorithm)
            }),
            isClient && new _buildManifestPlugin.default({
                buildId,
                rewrites,
                isDevFallback,
                exportRuntime: hasConcurrentFeatures,
                appDirEnabled: !!config.experimental.appDir
            }),
            new _profilingPlugin.ProfilingPlugin({
                runWebpackSpan
            }),
            config.optimizeFonts && !dev && isNodeServer && function() {
                const { FontStylesheetGatheringPlugin  } = require("./webpack/plugins/font-stylesheet-gathering-plugin");
                return new FontStylesheetGatheringPlugin({
                    isLikeServerless,
                    adjustFontFallbacks: config.experimental.adjustFontFallbacks
                });
            }(),
            new _wellknownErrorsPlugin.WellKnownErrorsPlugin(),
            isClient && new _copyFilePlugin.CopyFilePlugin({
                filePath: require.resolve("./polyfills/polyfill-nomodule"),
                cacheKey: "12.3.1",
                name: `static/chunks/polyfills${dev ? "" : "-[hash]"}.js`,
                minimize: false,
                info: {
                    [_constants1.CLIENT_STATIC_FILES_RUNTIME_POLYFILLS_SYMBOL]: 1,
                    // This file is already minified
                    minimized: true
                }
            }),
            !!config.experimental.appDir && hasServerComponents && isClient && new _appBuildManifestPlugin.AppBuildManifestPlugin({
                dev
            }),
            hasServerComponents && !!config.experimental.appDir && (isClient ? new _flightManifestPlugin.FlightManifestPlugin({
                dev
            }) : new _flightClientEntryPlugin.FlightClientEntryPlugin({
                dev,
                isEdgeServer
            })),
            !dev && isClient && !!((ref2 = config.experimental.sri) == null ? void 0 : ref2.algorithm) && new _subresourceIntegrityPlugin.SubresourceIntegrityPlugin(config.experimental.sri.algorithm),
            !dev && isClient && new (require("./webpack/plugins/telemetry-plugin")).TelemetryPlugin(new Map([
                [
                    "swcLoader",
                    useSWCLoader
                ],
                [
                    "swcMinify",
                    config.swcMinify
                ],
                [
                    "swcRelay",
                    !!((ref3 = config.compiler) == null ? void 0 : ref3.relay)
                ],
                [
                    "swcStyledComponents",
                    !!((ref4 = config.compiler) == null ? void 0 : ref4.styledComponents)
                ],
                [
                    "swcReactRemoveProperties",
                    !!((ref5 = config.compiler) == null ? void 0 : ref5.reactRemoveProperties), 
                ],
                [
                    "swcExperimentalDecorators",
                    !!(jsConfig == null ? void 0 : (ref6 = jsConfig.compilerOptions) == null ? void 0 : ref6.experimentalDecorators), 
                ],
                [
                    "swcRemoveConsole",
                    !!((ref7 = config.compiler) == null ? void 0 : ref7.removeConsole)
                ],
                [
                    "swcImportSource",
                    !!(jsConfig == null ? void 0 : (ref8 = jsConfig.compilerOptions) == null ? void 0 : ref8.jsxImportSource)
                ],
                [
                    "swcEmotion",
                    !!((ref9 = config.compiler) == null ? void 0 : ref9.emotion)
                ],
                SWCBinaryTarget, 
            ].filter(Boolean))), 
        ].filter(Boolean)
    };
    // Support tsconfig and jsconfig baseUrl
    if (resolvedBaseUrl) {
        var ref25, ref26;
        (ref25 = webpackConfig.resolve) == null ? void 0 : (ref26 = ref25.modules) == null ? void 0 : ref26.push(resolvedBaseUrl);
    }
    (ref10 = webpackConfig.resolve) == null ? void 0 : (ref11 = ref10.plugins) == null ? void 0 : ref11.unshift(new _jsconfigPathsPlugin.JsConfigPathsPlugin((jsConfig == null ? void 0 : (ref12 = jsConfig.compilerOptions) == null ? void 0 : ref12.paths) || {}, resolvedBaseUrl || dir));
    const webpack5Config = webpackConfig;
    if (isEdgeServer) {
        var ref27, ref28, ref29, ref30, ref31, ref32;
        (ref27 = webpack5Config.module) == null ? void 0 : (ref28 = ref27.rules) == null ? void 0 : ref28.unshift({
            test: /\.wasm$/,
            loader: "next-middleware-wasm-loader",
            type: "javascript/auto",
            resourceQuery: /module/i
        });
        (ref29 = webpack5Config.module) == null ? void 0 : (ref30 = ref29.rules) == null ? void 0 : ref30.unshift({
            dependency: "url",
            loader: "next-middleware-asset-loader",
            type: "javascript/auto",
            layer: _constants.WEBPACK_LAYERS.edgeAsset
        });
        (ref31 = webpack5Config.module) == null ? void 0 : (ref32 = ref31.rules) == null ? void 0 : ref32.unshift({
            issuerLayer: _constants.WEBPACK_LAYERS.edgeAsset,
            type: "asset/source"
        });
    }
    webpack5Config.experiments = {
        layers: true,
        cacheUnaffected: true,
        buildHttp: Array.isArray(config.experimental.urlImports) ? {
            allowedUris: config.experimental.urlImports,
            cacheLocation: _path.default.join(dir, "next.lock/data"),
            lockfileLocation: _path.default.join(dir, "next.lock/lock.json")
        } : config.experimental.urlImports ? {
            cacheLocation: _path.default.join(dir, "next.lock/data"),
            lockfileLocation: _path.default.join(dir, "next.lock/lock.json"),
            ...config.experimental.urlImports
        } : undefined
    };
    webpack5Config.module.parser = {
        javascript: {
            url: "relative"
        }
    };
    webpack5Config.module.generator = {
        asset: {
            filename: "static/media/[name].[hash:8][ext]"
        }
    };
    if (!webpack5Config.output) {
        webpack5Config.output = {};
    }
    if (isClient) {
        webpack5Config.output.trustedTypes = "nextjs#bundler";
    }
    if (isClient || isEdgeServer) {
        webpack5Config.output.enabledLibraryTypes = [
            "assign"
        ];
    }
    if (dev) {
        // @ts-ignore unsafeCache exists
        webpack5Config.module.unsafeCache = (module)=>!/[\\/]pages[\\/][^\\/]+(?:$|\?|#)/.test(module.resource);
    }
    // This enables managedPaths for all node_modules
    // and also for the unplugged folder when using yarn pnp
    // It also add the yarn cache to the immutable paths
    webpack5Config.snapshot = {};
    if (process.versions.pnp === "3") {
        webpack5Config.snapshot.managedPaths = [
            /^(.+?(?:[\\/]\.yarn[\\/]unplugged[\\/][^\\/]+)?[\\/]node_modules[\\/])/, 
        ];
    } else {
        webpack5Config.snapshot.managedPaths = [
            /^(.+?[\\/]node_modules[\\/])/
        ];
    }
    if (process.versions.pnp === "3") {
        webpack5Config.snapshot.immutablePaths = [
            /^(.+?[\\/]cache[\\/][^\\/]+\.zip[\\/]node_modules[\\/])/, 
        ];
    }
    if (dev) {
        if (!webpack5Config.optimization) {
            webpack5Config.optimization = {};
        }
        // For Server Components, it's necessary to have provided exports collected
        // to generate the correct flight manifest.
        if (!hasServerComponents) {
            webpack5Config.optimization.providedExports = false;
        }
        webpack5Config.optimization.usedExports = false;
    }
    const configVars = JSON.stringify({
        crossOrigin: config.crossOrigin,
        pageExtensions: pageExtensions,
        trailingSlash: config.trailingSlash,
        buildActivity: config.devIndicators.buildActivity,
        buildActivityPosition: config.devIndicators.buildActivityPosition,
        productionBrowserSourceMaps: !!config.productionBrowserSourceMaps,
        reactStrictMode: config.reactStrictMode,
        optimizeFonts: config.optimizeFonts,
        optimizeCss: config.experimental.optimizeCss,
        nextScriptWorkers: config.experimental.nextScriptWorkers,
        scrollRestoration: config.experimental.scrollRestoration,
        basePath: config.basePath,
        pageEnv: config.experimental.pageEnv,
        excludeDefaultMomentLocales: config.excludeDefaultMomentLocales,
        assetPrefix: config.assetPrefix,
        disableOptimizedLoading,
        target,
        isEdgeRuntime: isEdgeServer,
        reactProductionProfiling,
        webpack: !!config.webpack,
        hasRewrites,
        runtime: config.experimental.runtime,
        swcMinify: config.swcMinify,
        swcLoader: useSWCLoader,
        removeConsole: (ref13 = config.compiler) == null ? void 0 : ref13.removeConsole,
        reactRemoveProperties: (ref14 = config.compiler) == null ? void 0 : ref14.reactRemoveProperties,
        styledComponents: (ref15 = config.compiler) == null ? void 0 : ref15.styledComponents,
        relay: (ref16 = config.compiler) == null ? void 0 : ref16.relay,
        emotion: (ref17 = config.compiler) == null ? void 0 : ref17.emotion,
        modularizeImports: (ref18 = config.experimental) == null ? void 0 : ref18.modularizeImports,
        legacyBrowsers: (ref19 = config.experimental) == null ? void 0 : ref19.legacyBrowsers
    });
    const cache = {
        type: "filesystem",
        // Includes:
        //  - Next.js version
        //  - next.config.js keys that affect compilation
        version: `${"12.3.1"}|${configVars}`,
        cacheDirectory: _path.default.join(distDir, "cache", "webpack")
    };
    // Adds `next.config.js` as a buildDependency when custom webpack config is provided
    if (config.webpack && config.configFile) {
        cache.buildDependencies = {
            config: [
                config.configFile
            ]
        };
    }
    webpack5Config.cache = cache;
    if (process.env.NEXT_WEBPACK_LOGGING) {
        const infra = process.env.NEXT_WEBPACK_LOGGING.includes("infrastructure");
        const profileClient = process.env.NEXT_WEBPACK_LOGGING.includes("profile-client");
        const profileServer = process.env.NEXT_WEBPACK_LOGGING.includes("profile-server");
        const summaryClient = process.env.NEXT_WEBPACK_LOGGING.includes("summary-client");
        const summaryServer = process.env.NEXT_WEBPACK_LOGGING.includes("summary-server");
        const profile = profileClient && isClient || profileServer && (isNodeServer || isEdgeServer);
        const summary = summaryClient && isClient || summaryServer && (isNodeServer || isEdgeServer);
        const logDefault = !infra && !profile && !summary;
        if (logDefault || infra) {
            webpack5Config.infrastructureLogging = {
                level: "verbose",
                debug: /FileSystemInfo/
            };
        }
        if (logDefault || profile) {
            webpack5Config.plugins.push((compiler)=>{
                compiler.hooks.done.tap("next-webpack-logging", (stats)=>{
                    console.log(stats.toString({
                        colors: true,
                        logging: logDefault ? "log" : "verbose"
                    }));
                });
            });
        } else if (summary) {
            webpack5Config.plugins.push((compiler)=>{
                compiler.hooks.done.tap("next-webpack-logging", (stats)=>{
                    console.log(stats.toString({
                        preset: "summary",
                        colors: true,
                        timings: true
                    }));
                });
            });
        }
        if (profile) {
            const ProgressPlugin = _webpack.webpack.ProgressPlugin;
            webpack5Config.plugins.push(new ProgressPlugin({
                profile: true
            }));
            webpack5Config.profile = true;
        }
    }
    webpackConfig = await (0, _config).build(webpackConfig, {
        supportedBrowsers,
        rootDirectory: dir,
        customAppFile: pagesDir ? new RegExp((0, _escapeRegexp).escapeStringRegexp(_path.default.join(pagesDir, `_app`))) : undefined,
        isDevelopment: dev,
        isServer: isNodeServer || isEdgeServer,
        isEdgeRuntime: isEdgeServer,
        targetWeb: isClient || isEdgeServer,
        assetPrefix: config.assetPrefix || "",
        sassOptions: config.sassOptions,
        productionBrowserSourceMaps: config.productionBrowserSourceMaps,
        future: config.future,
        experimental: config.experimental,
        disableStaticImages: config.images.disableStaticImages
    });
    // @ts-ignore Cache exists
    webpackConfig.cache.name = `${webpackConfig.name}-${webpackConfig.mode}${isDevFallback ? "-fallback" : ""}`;
    let originalDevtool = webpackConfig.devtool;
    if (typeof config.webpack === "function") {
        var ref33, ref34;
        webpackConfig = config.webpack(webpackConfig, {
            dir,
            dev,
            isServer: isNodeServer || isEdgeServer,
            buildId,
            config,
            defaultLoaders,
            totalPages: Object.keys(entrypoints).length,
            webpack: _webpack.webpack,
            ...isNodeServer || isEdgeServer ? {
                nextRuntime: isEdgeServer ? "edge" : "nodejs"
            } : {}
        });
        if (!webpackConfig) {
            throw new Error(`Webpack config is undefined. You may have forgot to return properly from within the "webpack" method of your ${config.configFileName}.\n` + "See more info here https://nextjs.org/docs/messages/undefined-webpack-config");
        }
        if (dev && originalDevtool !== webpackConfig.devtool) {
            webpackConfig.devtool = originalDevtool;
            devtoolRevertWarning(originalDevtool);
        }
        // eslint-disable-next-line no-shadow
        const webpack5Config = webpackConfig;
        // disable lazy compilation of entries as next.js has it's own method here
        if (((ref33 = webpack5Config.experiments) == null ? void 0 : ref33.lazyCompilation) === true) {
            webpack5Config.experiments.lazyCompilation = {
                entries: false
            };
        } else if (typeof ((ref34 = webpack5Config.experiments) == null ? void 0 : ref34.lazyCompilation) === "object" && webpack5Config.experiments.lazyCompilation.entries !== false) {
            webpack5Config.experiments.lazyCompilation.entries = false;
        }
        if (typeof webpackConfig.then === "function") {
            console.warn("> Promise returned in next config. https://nextjs.org/docs/messages/promise-in-next-config");
        }
    }
    if (!config.images.disableStaticImages) {
        var ref35;
        const rules = ((ref35 = webpackConfig.module) == null ? void 0 : ref35.rules) || [];
        const hasCustomSvg = rules.some((rule)=>rule && typeof rule === "object" && rule.loader !== "next-image-loader" && "test" in rule && rule.test instanceof RegExp && rule.test.test(".svg"));
        const nextImageRule = rules.find((rule)=>rule && typeof rule === "object" && rule.loader === "next-image-loader");
        if (hasCustomSvg && nextImageRule && nextImageRule && typeof nextImageRule === "object") {
            // Exclude svg if the user already defined it in custom
            // webpack config such as `@svgr/webpack` plugin or
            // the `babel-plugin-inline-react-svg` plugin.
            nextImageRule.test = /\.(png|jpg|jpeg|gif|webp|avif|ico|bmp)$/i;
        }
    }
    if (config.experimental.craCompat && ((ref20 = webpackConfig.module) == null ? void 0 : ref20.rules) && webpackConfig.plugins) {
        // CRA allows importing non-webpack handled files with file-loader
        // these need to be the last rule to prevent catching other items
        // https://github.com/facebook/create-react-app/blob/fddce8a9e21bf68f37054586deb0c8636a45f50b/packages/react-scripts/config/webpack.config.js#L594
        const fileLoaderExclude = [
            /\.(js|mjs|jsx|ts|tsx|json)$/
        ];
        const fileLoader = {
            exclude: fileLoaderExclude,
            issuer: fileLoaderExclude,
            type: "asset/resource"
        };
        const topRules = [];
        const innerRules = [];
        for (const rule of webpackConfig.module.rules){
            if (!rule || typeof rule !== "object") continue;
            if (rule.resolve) {
                topRules.push(rule);
            } else {
                if (rule.oneOf && !(rule.test || rule.exclude || rule.resource || rule.issuer)) {
                    rule.oneOf.forEach((r)=>innerRules.push(r));
                } else {
                    innerRules.push(rule);
                }
            }
        }
        webpackConfig.module.rules = [
            ...topRules,
            {
                oneOf: [
                    ...innerRules,
                    fileLoader
                ]
            }, 
        ];
    }
    // Backwards compat with webpack-dev-middleware options object
    if (typeof config.webpackDevMiddleware === "function") {
        const options = config.webpackDevMiddleware({
            watchOptions: webpackConfig.watchOptions
        });
        if (options.watchOptions) {
            webpackConfig.watchOptions = options.watchOptions;
        }
    }
    function canMatchCss(rule) {
        if (!rule) {
            return false;
        }
        const fileNames = [
            "/tmp/NEXTJS_CSS_DETECTION_FILE.css",
            "/tmp/NEXTJS_CSS_DETECTION_FILE.scss",
            "/tmp/NEXTJS_CSS_DETECTION_FILE.sass",
            "/tmp/NEXTJS_CSS_DETECTION_FILE.less",
            "/tmp/NEXTJS_CSS_DETECTION_FILE.styl", 
        ];
        if (rule instanceof RegExp && fileNames.some((input)=>rule.test(input))) {
            return true;
        }
        if (typeof rule === "function") {
            if (fileNames.some((input)=>{
                try {
                    if (rule(input)) {
                        return true;
                    }
                } catch (_) {}
                return false;
            })) {
                return true;
            }
        }
        if (Array.isArray(rule) && rule.some(canMatchCss)) {
            return true;
        }
        return false;
    }
    var ref36;
    const hasUserCssConfig = (ref36 = (ref21 = webpackConfig.module) == null ? void 0 : (ref22 = ref21.rules) == null ? void 0 : ref22.some((rule)=>canMatchCss(rule.test) || canMatchCss(rule.include))) != null ? ref36 : false;
    if (hasUserCssConfig) {
        var ref37, ref38, ref39, ref40, ref41;
        // only show warning for one build
        if (isNodeServer || isEdgeServer) {
            console.warn(_chalk.default.yellow.bold("Warning: ") + _chalk.default.bold("Built-in CSS support is being disabled due to custom CSS configuration being detected.\n") + "See here for more info: https://nextjs.org/docs/messages/built-in-css-disabled\n");
        }
        if ((ref37 = webpackConfig.module) == null ? void 0 : (ref38 = ref37.rules) == null ? void 0 : ref38.length) {
            // Remove default CSS Loaders
            webpackConfig.module.rules.forEach((r)=>{
                if (!r || typeof r !== "object") return;
                if (Array.isArray(r.oneOf)) {
                    r.oneOf = r.oneOf.filter((o)=>o[Symbol.for("__next_css_remove")] !== true);
                }
            });
        }
        if ((ref39 = webpackConfig.plugins) == null ? void 0 : ref39.length) {
            // Disable CSS Extraction Plugin
            webpackConfig.plugins = webpackConfig.plugins.filter((p)=>p.__next_css_remove !== true);
        }
        if ((ref40 = webpackConfig.optimization) == null ? void 0 : (ref41 = ref40.minimizer) == null ? void 0 : ref41.length) {
            // Disable CSS Minifier
            webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter((e)=>e.__next_css_remove !== true);
        }
    }
    // Inject missing React Refresh loaders so that development mode is fast:
    if (dev && isClient) {
        attachReactRefresh(webpackConfig, defaultLoaders.babel);
    }
    // check if using @zeit/next-typescript and show warning
    if ((isNodeServer || isEdgeServer) && webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
        let foundTsRule = false;
        webpackConfig.module.rules = webpackConfig.module.rules.filter((rule)=>{
            if (!rule || typeof rule !== "object") return true;
            if (!(rule.test instanceof RegExp)) return true;
            if ("noop.ts".match(rule.test) && !"noop.js".match(rule.test)) {
                // remove if it matches @zeit/next-typescript
                foundTsRule = rule.use === defaultLoaders.babel;
                return !foundTsRule;
            }
            return true;
        });
        if (foundTsRule) {
            console.warn(`\n@zeit/next-typescript is no longer needed since Next.js has built-in support for TypeScript now. Please remove it from your ${config.configFileName} and your .babelrc\n`);
        }
    }
    // Patch `@zeit/next-sass`, `@zeit/next-less`, `@zeit/next-stylus` for compatibility
    if (webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
        [].forEach.call(webpackConfig.module.rules, function(rule) {
            if (!(rule.test instanceof RegExp && Array.isArray(rule.use))) {
                return;
            }
            const isSass = rule.test.source === "\\.scss$" || rule.test.source === "\\.sass$";
            const isLess = rule.test.source === "\\.less$";
            const isCss = rule.test.source === "\\.css$";
            const isStylus = rule.test.source === "\\.styl$";
            // Check if the rule we're iterating over applies to Sass, Less, or CSS
            if (!(isSass || isLess || isCss || isStylus)) {
                return;
            }
            [].forEach.call(rule.use, function(use) {
                if (!(use && typeof use === "object" && // Identify use statements only pertaining to `css-loader`
                (use.loader === "css-loader" || use.loader === "css-loader/locals") && use.options && typeof use.options === "object" && // The `minimize` property is a good heuristic that we need to
                // perform this hack. The `minimize` property was only valid on
                // old `css-loader` versions. Custom setups (that aren't next-sass,
                // next-less or next-stylus) likely have the newer version.
                // We still handle this gracefully below.
                (Object.prototype.hasOwnProperty.call(use.options, "minimize") || Object.prototype.hasOwnProperty.call(use.options, "exportOnlyLocals")))) {
                    return;
                }
                // Try to monkey patch within a try-catch. We shouldn't fail the build
                // if we cannot pull this off.
                // The user may not even be using the `next-sass` or `next-less` or
                // `next-stylus` plugins.
                // If it does work, great!
                try {
                    // Resolve the version of `@zeit/next-css` as depended on by the Sass,
                    // Less or Stylus plugin.
                    const correctNextCss = require.resolve("@zeit/next-css", {
                        paths: [
                            isCss ? dir : require.resolve(isSass ? "@zeit/next-sass" : isLess ? "@zeit/next-less" : isStylus ? "@zeit/next-stylus" : "next"), 
                        ]
                    });
                    // If we found `@zeit/next-css` ...
                    if (correctNextCss) {
                        // ... resolve the version of `css-loader` shipped with that
                        // package instead of whichever was hoisted highest in your
                        // `node_modules` tree.
                        const correctCssLoader = require.resolve(use.loader, {
                            paths: [
                                correctNextCss
                            ]
                        });
                        if (correctCssLoader) {
                            // We saved the user from a failed build!
                            use.loader = correctCssLoader;
                        }
                    }
                } catch (_) {
                // The error is not required to be handled.
                }
            });
        });
    }
    // Backwards compat for `main.js` entry key
    // and setup of dependencies between entries
    // we can't do that in the initial entry for
    // backward-compat reasons
    const originalEntry = webpackConfig.entry;
    if (typeof originalEntry !== "undefined") {
        const updatedEntry = async ()=>{
            const entry = typeof originalEntry === "function" ? await originalEntry() : originalEntry;
            // Server compilation doesn't have main.js
            if (clientEntries && Array.isArray(entry["main.js"]) && entry["main.js"].length > 0) {
                const originalFile = clientEntries[_constants1.CLIENT_STATIC_FILES_RUNTIME_MAIN];
                entry[_constants1.CLIENT_STATIC_FILES_RUNTIME_MAIN] = [
                    ...entry["main.js"],
                    originalFile, 
                ];
            }
            delete entry["main.js"];
            for (const name of Object.keys(entry)){
                entry[name] = (0, _entries).finalizeEntrypoint({
                    value: entry[name],
                    compilerType,
                    name,
                    appDir: config.experimental.appDir
                });
            }
            return entry;
        };
        // @ts-ignore webpack 5 typings needed
        webpackConfig.entry = updatedEntry;
    }
    if (!dev && typeof webpackConfig.entry === "function") {
        // entry is always a function
        webpackConfig.entry = await webpackConfig.entry();
    }
    return webpackConfig;
}
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
const NEXT_PROJECT_ROOT = (0, _path).join(__dirname, "..", "..");
const NEXT_PROJECT_ROOT_DIST = (0, _path).join(NEXT_PROJECT_ROOT, "dist");
const NEXT_PROJECT_ROOT_DIST_CLIENT = (0, _path).join(NEXT_PROJECT_ROOT_DIST, "client");
function errorIfEnvConflicted(config, key) {
    const isPrivateKey = /^(?:NODE_.+)|^(?:__.+)$/i.test(key);
    const hasNextRuntimeKey = key === "NEXT_RUNTIME";
    if (isPrivateKey || hasNextRuntimeKey) {
        throw new Error(`The key "${key}" under "env" in ${config.configFileName} is not allowed. https://nextjs.org/docs/messages/env-key-not-allowed`);
    }
}
const watchOptions = Object.freeze({
    aggregateTimeout: 5,
    ignored: [
        "**/.git/**",
        "**/.next/**"
    ]
});
function getDefineEnv({ dev , config , distDir , isClient , hasRewrites , hasReactRoot , isNodeServer , isEdgeServer , middlewareMatchers  }) {
    var ref, ref48, ref49;
    return {
        // internal field to identify the plugin config
        __NEXT_DEFINE_ENV: "true",
        ...Object.keys(process.env).reduce((prev, key)=>{
            if (key.startsWith("NEXT_PUBLIC_")) {
                prev[`process.env.${key}`] = JSON.stringify(process.env[key]);
            }
            return prev;
        }, {}),
        ...Object.keys(config.env).reduce((acc, key)=>{
            errorIfEnvConflicted(config, key);
            return {
                ...acc,
                [`process.env.${key}`]: JSON.stringify(config.env[key])
            };
        }, {}),
        ...!isEdgeServer ? {} : {
            EdgeRuntime: JSON.stringify(/**
             * Cloud providers can set this environment variable to allow users
             * and library authors to have different implementations based on
             * the runtime they are running with, if it's not using `edge-runtime`
             */ process.env.NEXT_EDGE_RUNTIME_PROVIDER || "edge-runtime")
        },
        // TODO: enforce `NODE_ENV` on `process.env`, and add a test:
        "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production"),
        ...(isNodeServer || isEdgeServer) && {
            "process.env.NEXT_RUNTIME": JSON.stringify(isEdgeServer ? "edge" : "nodejs")
        },
        "process.env.__NEXT_MIDDLEWARE_MATCHERS": JSON.stringify(middlewareMatchers || []),
        "process.env.__NEXT_MANUAL_CLIENT_BASE_PATH": JSON.stringify(config.experimental.manualClientBasePath),
        "process.env.__NEXT_NEW_LINK_BEHAVIOR": JSON.stringify(config.experimental.newNextLinkBehavior),
        "process.env.__NEXT_OPTIMISTIC_CLIENT_CACHE": JSON.stringify(config.experimental.optimisticClientCache),
        "process.env.__NEXT_CROSS_ORIGIN": JSON.stringify(config.crossOrigin),
        "process.browser": JSON.stringify(isClient),
        "process.env.__NEXT_TEST_MODE": JSON.stringify(process.env.__NEXT_TEST_MODE),
        // This is used in client/dev-error-overlay/hot-dev-client.js to replace the dist directory
        ...dev && (isClient || isEdgeServer) ? {
            "process.env.__NEXT_DIST_DIR": JSON.stringify(distDir)
        } : {},
        "process.env.__NEXT_TRAILING_SLASH": JSON.stringify(config.trailingSlash),
        "process.env.__NEXT_BUILD_INDICATOR": JSON.stringify(config.devIndicators.buildActivity),
        "process.env.__NEXT_BUILD_INDICATOR_POSITION": JSON.stringify(config.devIndicators.buildActivityPosition),
        "process.env.__NEXT_STRICT_MODE": JSON.stringify(config.reactStrictMode),
        "process.env.__NEXT_REACT_ROOT": JSON.stringify(hasReactRoot),
        "process.env.__NEXT_OPTIMIZE_FONTS": JSON.stringify(!dev && config.optimizeFonts),
        "process.env.__NEXT_OPTIMIZE_CSS": JSON.stringify(config.experimental.optimizeCss && !dev),
        "process.env.__NEXT_SCRIPT_WORKERS": JSON.stringify(config.experimental.nextScriptWorkers && !dev),
        "process.env.__NEXT_SCROLL_RESTORATION": JSON.stringify(config.experimental.scrollRestoration),
        "process.env.__NEXT_IMAGE_OPTS": JSON.stringify({
            deviceSizes: config.images.deviceSizes,
            imageSizes: config.images.imageSizes,
            path: config.images.path,
            loader: config.images.loader,
            dangerouslyAllowSVG: config.images.dangerouslyAllowSVG,
            unoptimized: config == null ? void 0 : (ref = config.images) == null ? void 0 : ref.unoptimized,
            ...dev ? {
                // pass domains in development to allow validating on the client
                domains: config.images.domains,
                remotePatterns: (ref48 = config.images) == null ? void 0 : ref48.remotePatterns
            } : {}
        }),
        "process.env.__NEXT_ROUTER_BASEPATH": JSON.stringify(config.basePath),
        "process.env.__NEXT_HAS_REWRITES": JSON.stringify(hasRewrites),
        "process.env.__NEXT_I18N_SUPPORT": JSON.stringify(!!config.i18n),
        "process.env.__NEXT_I18N_DOMAINS": JSON.stringify((ref49 = config.i18n) == null ? void 0 : ref49.domains),
        "process.env.__NEXT_ANALYTICS_ID": JSON.stringify(config.analyticsId),
        ...isNodeServer || isEdgeServer ? {
            // Fix bad-actors in the npm ecosystem (e.g. `node-formidable`)
            // This is typically found in unmaintained modules from the
            // pre-webpack era (common in server-side code)
            "global.GENTLY": JSON.stringify(false)
        } : undefined,
        // stub process.env with proxy to warn a missing value is
        // being accessed in development mode
        ...config.experimental.pageEnv && dev ? {
            "process.env": `
            new Proxy(${isNodeServer ? "process.env" : "{}"}, {
              get(target, prop) {
                if (typeof target[prop] === 'undefined') {
                  console.warn(\`An environment variable (\${prop}) that was not provided in the environment was accessed.\nSee more info here: https://nextjs.org/docs/messages/missing-env-value\`)
                }
                return target[prop]
              }
            })
          `
        } : {}
    };
}
function getSupportedBrowsers(dir, isDevelopment, config) {
    let browsers;
    try {
        const browsersListConfig = _browserslist.default.loadConfig({
            path: dir,
            env: isDevelopment ? "development" : "production"
        });
        // Running `browserslist` resolves `extends` and other config features into a list of browsers
        if (browsersListConfig && browsersListConfig.length > 0) {
            browsers = (0, _browserslist).default(browsersListConfig);
        }
    } catch  {}
    // When user has browserslist use that target
    if (browsers && browsers.length > 0) {
        return browsers;
    }
    // When user does not have browserslist use the default target
    // When `experimental.legacyBrowsers: false` the modern default is used
    return config.experimental.legacyBrowsers ? undefined : _constants1.MODERN_BROWSERSLIST_TARGET;
}
const devtoolRevertWarning = (0, _utils).execOnce((devtool)=>{
    console.warn(_chalk.default.yellow.bold("Warning: ") + _chalk.default.bold(`Reverting webpack devtool to '${devtool}'.\n`) + "Changing the webpack devtool in development mode will cause severe performance regressions.\n" + "Read more: https://nextjs.org/docs/messages/improper-devtool");
});
let loggedSwcDisabled = false;
let loggedIgnoredCompilerOptions = false;
function getOptimizedAliases() {
    const stubWindowFetch = _path.default.join(__dirname, "polyfills", "fetch", "index.js");
    const stubObjectAssign = _path.default.join(__dirname, "polyfills", "object-assign.js");
    const shimAssign = _path.default.join(__dirname, "polyfills", "object.assign");
    return Object.assign({}, {
        unfetch$: stubWindowFetch,
        "isomorphic-unfetch$": stubWindowFetch,
        "whatwg-fetch$": _path.default.join(__dirname, "polyfills", "fetch", "whatwg-fetch.js")
    }, {
        "object-assign$": stubObjectAssign,
        // Stub Package: object.assign
        "object.assign/auto": _path.default.join(shimAssign, "auto.js"),
        "object.assign/implementation": _path.default.join(shimAssign, "implementation.js"),
        "object.assign$": _path.default.join(shimAssign, "index.js"),
        "object.assign/polyfill": _path.default.join(shimAssign, "polyfill.js"),
        "object.assign/shim": _path.default.join(shimAssign, "shim.js"),
        // Replace: full URL polyfill with platform-based polyfill
        url: require.resolve("next/dist/compiled/native-url")
    });
}
function attachReactRefresh(webpackConfig, targetLoader) {
    var ref, ref50;
    let injections = 0;
    const reactRefreshLoaderName = "next/dist/compiled/@next/react-refresh-utils/dist/loader";
    const reactRefreshLoader = require.resolve(reactRefreshLoaderName);
    (ref = webpackConfig.module) == null ? void 0 : (ref50 = ref.rules) == null ? void 0 : ref50.forEach((rule)=>{
        if (rule && typeof rule === "object" && "use" in rule) {
            const curr = rule.use;
            // When the user has configured `defaultLoaders.babel` for a input file:
            if (curr === targetLoader) {
                ++injections;
                rule.use = [
                    reactRefreshLoader,
                    curr
                ];
            } else if (Array.isArray(curr) && curr.some((r)=>r === targetLoader) && // Check if loader already exists:
            !curr.some((r)=>r === reactRefreshLoader || r === reactRefreshLoaderName)) {
                ++injections;
                const idx = curr.findIndex((r)=>r === targetLoader);
                // Clone to not mutate user input
                rule.use = [
                    ...curr
                ];
                // inject / input: [other, babel] output: [other, refresh, babel]:
                rule.use.splice(idx, 0, reactRefreshLoader);
            }
        }
    });
    if (injections) {
        Log.info(`automatically enabled Fast Refresh for ${injections} custom loader${injections > 1 ? "s" : ""}`);
    }
}
const NODE_RESOLVE_OPTIONS = {
    dependencyType: "commonjs",
    modules: [
        "node_modules"
    ],
    fallback: false,
    exportsFields: [
        "exports"
    ],
    importsFields: [
        "imports"
    ],
    conditionNames: [
        "node",
        "require"
    ],
    descriptionFiles: [
        "package.json"
    ],
    extensions: [
        ".js",
        ".json",
        ".node"
    ],
    enforceExtensions: false,
    symlinks: true,
    mainFields: [
        "main"
    ],
    mainFiles: [
        "index"
    ],
    roots: [],
    fullySpecified: false,
    preferRelative: false,
    preferAbsolute: false,
    restrictions: []
};
exports.NODE_RESOLVE_OPTIONS = NODE_RESOLVE_OPTIONS;
const NODE_BASE_RESOLVE_OPTIONS = {
    ...NODE_RESOLVE_OPTIONS,
    alias: false
};
exports.NODE_BASE_RESOLVE_OPTIONS = NODE_BASE_RESOLVE_OPTIONS;
const NODE_ESM_RESOLVE_OPTIONS = {
    ...NODE_RESOLVE_OPTIONS,
    alias: false,
    dependencyType: "esm",
    conditionNames: [
        "node",
        "import"
    ],
    fullySpecified: true
};
exports.NODE_ESM_RESOLVE_OPTIONS = NODE_ESM_RESOLVE_OPTIONS;
const NODE_BASE_ESM_RESOLVE_OPTIONS = {
    ...NODE_ESM_RESOLVE_OPTIONS,
    alias: false
};
exports.NODE_BASE_ESM_RESOLVE_OPTIONS = NODE_BASE_ESM_RESOLVE_OPTIONS;
const nextImageLoaderRegex = /\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i;
exports.nextImageLoaderRegex = nextImageLoaderRegex;
async function resolveExternal(appDir, esmExternalsConfig, context, request, isEsmRequested, getResolve, isLocalCallback, baseResolveCheck = true, esmResolveOptions = NODE_ESM_RESOLVE_OPTIONS, nodeResolveOptions = NODE_RESOLVE_OPTIONS, baseEsmResolveOptions = NODE_BASE_ESM_RESOLVE_OPTIONS, baseResolveOptions = NODE_BASE_RESOLVE_OPTIONS) {
    const esmExternals = !!esmExternalsConfig;
    const looseEsmExternals = esmExternalsConfig === "loose";
    let res = null;
    let isEsm = false;
    let preferEsmOptions = esmExternals && isEsmRequested ? [
        true,
        false
    ] : [
        false
    ];
    for (const preferEsm of preferEsmOptions){
        const resolve = getResolve(preferEsm ? esmResolveOptions : nodeResolveOptions);
        // Resolve the import with the webpack provided context, this
        // ensures we're resolving the correct version when multiple
        // exist.
        try {
            [res, isEsm] = await resolve(context, request);
        } catch (err) {
            res = null;
        }
        if (!res) {
            continue;
        }
        // ESM externals can only be imported (and not required).
        // Make an exception in loose mode.
        if (!isEsmRequested && isEsm && !looseEsmExternals) {
            continue;
        }
        if (isLocalCallback) {
            return {
                localRes: isLocalCallback(res)
            };
        }
        // Bundled Node.js code is relocated without its node_modules tree.
        // This means we need to make sure its request resolves to the same
        // package that'll be available at runtime. If it's not identical,
        // we need to bundle the code (even if it _should_ be external).
        if (baseResolveCheck) {
            let baseRes;
            let baseIsEsm;
            try {
                const baseResolve = getResolve(isEsm ? baseEsmResolveOptions : baseResolveOptions);
                [baseRes, baseIsEsm] = await baseResolve(appDir, request);
            } catch (err) {
                baseRes = null;
                baseIsEsm = false;
            }
            // Same as above: if the package, when required from the root,
            // would be different from what the real resolution would use, we
            // cannot externalize it.
            // if request is pointing to a symlink it could point to the the same file,
            // the resolver will resolve symlinks so this is handled
            if (baseRes !== res || isEsm !== baseIsEsm) {
                res = null;
                continue;
            }
        }
        break;
    }
    return {
        res,
        isEsm
    };
}

//# sourceMappingURL=webpack-config.js.map