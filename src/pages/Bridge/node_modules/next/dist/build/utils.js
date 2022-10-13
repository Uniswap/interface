"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.unique = unique;
exports.difference = difference;
exports.computeFromManifest = computeFromManifest;
exports.isMiddlewareFilename = isMiddlewareFilename;
exports.printTreeView = printTreeView;
exports.printCustomRoutes = printCustomRoutes;
exports.getJsPageSizeInKb = getJsPageSizeInKb;
exports.buildStaticPaths = buildStaticPaths;
exports.buildAppStaticPaths = buildAppStaticPaths;
exports.isPageStatic = isPageStatic;
exports.hasCustomGetInitialProps = hasCustomGetInitialProps;
exports.getNamedExports = getNamedExports;
exports.detectConflictingPaths = detectConflictingPaths;
exports.copyTracedFiles = copyTracedFiles;
exports.isReservedPage = isReservedPage;
exports.isCustomErrorPage = isCustomErrorPage;
exports.isMiddlewareFile = isMiddlewareFile;
exports.getPossibleMiddlewareFilenames = getPossibleMiddlewareFilenames;
exports.collectGenerateParams = void 0;
require("../server/node-polyfill-fetch");
var _requireHook = _interopRequireDefault(require("../build/webpack/require-hook"));
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _gzipSize = _interopRequireDefault(require("next/dist/compiled/gzip-size"));
var _textTable = _interopRequireDefault(require("next/dist/compiled/text-table"));
var _path = _interopRequireDefault(require("path"));
var _fs = require("fs");
var _reactIs = require("next/dist/compiled/react-is");
var _stripAnsi = _interopRequireDefault(require("next/dist/compiled/strip-ansi"));
var _constants = require("../lib/constants");
var _prettyBytes = _interopRequireDefault(require("../lib/pretty-bytes"));
var _routeRegex = require("../shared/lib/router/utils/route-regex");
var _routeMatcher = require("../shared/lib/router/utils/route-matcher");
var _isDynamic = require("../shared/lib/router/utils/is-dynamic");
var _escapePathDelimiters = _interopRequireDefault(require("../shared/lib/router/utils/escape-path-delimiters"));
var _findPageFile = require("../server/lib/find-page-file");
var _removeTrailingSlash = require("../shared/lib/router/utils/remove-trailing-slash");
var _normalizeLocalePath = require("../shared/lib/i18n/normalize-locale-path");
var Log = _interopRequireWildcard(require("./output/log"));
var _loadComponents = require("../server/load-components");
var _trace = require("../trace");
var _config = require("../server/config");
var _recursiveDelete = require("../lib/recursive-delete");
var _asyncSema = require("next/dist/compiled/async-sema");
var _denormalizePagePath = require("../shared/lib/page-path/denormalize-page-path");
var _normalizePagePath = require("../shared/lib/page-path/normalize-page-path");
var _sandbox = require("../server/web/sandbox");
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
const RESERVED_PAGE = /^\/(_app|_error|_document|api(\/|$))/;
const fileGzipStats = {};
const fsStatGzip = (file)=>{
    const cached = fileGzipStats[file];
    if (cached) return cached;
    return fileGzipStats[file] = _gzipSize.default.file(file);
};
const fileSize = async (file)=>(await _fs.promises.stat(file)).size;
const fileStats = {};
const fsStat = (file)=>{
    const cached = fileStats[file];
    if (cached) return cached;
    return fileStats[file] = fileSize(file);
};
(0, _requireHook).default();
function unique(main, sub) {
    return [
        ...new Set([
            ...main,
            ...sub
        ])
    ];
}
function difference(main, sub) {
    const a = new Set(main);
    const b = new Set(sub);
    return [
        ...a
    ].filter((x)=>!b.has(x));
}
/**
 * Return an array of the items shared by both arrays.
 */ function intersect(main, sub) {
    const a = new Set(main);
    const b = new Set(sub);
    return [
        ...new Set([
            ...a
        ].filter((x)=>b.has(x)))
    ];
}
function sum(a) {
    return a.reduce((size, stat)=>size + stat, 0);
}
function denormalizeAppPagePath(page) {
    return page + "/page";
}
let cachedBuildManifest;
let cachedAppBuildManifest;
let lastCompute;
let lastComputePageInfo;
async function computeFromManifest(manifests, distPath, gzipSize = true, pageInfos) {
    var ref, ref1;
    if (Object.is(cachedBuildManifest, manifests.build) && lastComputePageInfo === !!pageInfos && Object.is(cachedAppBuildManifest, manifests.app)) {
        return lastCompute;
    }
    // Determine the files that are in pages and app and count them, this will
    // tell us if they are unique or common.
    const countBuildFiles = (map, key, manifest)=>{
        for (const file of manifest[key]){
            if (key === "/_app") {
                map.set(file, Infinity);
            } else if (map.has(file)) {
                map.set(file, map.get(file) + 1);
            } else {
                map.set(file, 1);
            }
        }
    };
    const files = {
        pages: {
            each: new Map(),
            expected: 0
        }
    };
    for(const key1 in manifests.build.pages){
        if (pageInfos) {
            const pageInfo = pageInfos.get(key1);
            // don't include AMP pages since they don't rely on shared bundles
            // AMP First pages are not under the pageInfos key
            if (pageInfo == null ? void 0 : pageInfo.isHybridAmp) {
                continue;
            }
        }
        files.pages.expected++;
        countBuildFiles(files.pages.each, key1, manifests.build.pages);
    }
    // Collect the build files form the app manifest.
    if ((ref = manifests.app) == null ? void 0 : ref.pages) {
        files.app = {
            each: new Map(),
            expected: 0
        };
        for(const key in manifests.app.pages){
            files.app.expected++;
            countBuildFiles(files.app.each, key, manifests.app.pages);
        }
    }
    const getSize = gzipSize ? fsStatGzip : fsStat;
    const stats = new Map();
    var ref2;
    // For all of the files in the pages and app manifests, compute the file size
    // at once.
    await Promise.all([
        ...new Set([
            ...files.pages.each.keys(),
            ...(ref2 = (ref1 = files.app) == null ? void 0 : ref1.each.keys()) != null ? ref2 : [], 
        ]), 
    ].map(async (f)=>{
        try {
            // Add the file size to the stats.
            stats.set(f, await getSize(_path.default.join(distPath, f)));
        } catch  {}
    }));
    const groupFiles = async (listing)=>{
        const entries = [
            ...listing.each.entries()
        ];
        const shapeGroup = (group)=>group.reduce((acc, [f])=>{
                acc.files.push(f);
                const size = stats.get(f);
                if (typeof size === "number") {
                    acc.size.total += size;
                }
                return acc;
            }, {
                files: [],
                size: {
                    total: 0
                }
            });
        return {
            unique: shapeGroup(entries.filter(([, len])=>len === 1)),
            common: shapeGroup(entries.filter(([, len])=>len === listing.expected || len === Infinity))
        };
    };
    lastCompute = {
        router: {
            pages: await groupFiles(files.pages),
            app: files.app ? await groupFiles(files.app) : undefined
        },
        sizes: stats
    };
    cachedBuildManifest = manifests.build;
    cachedAppBuildManifest = manifests.app;
    lastComputePageInfo = !!pageInfos;
    return lastCompute;
}
function isMiddlewareFilename(file) {
    return file === _constants.MIDDLEWARE_FILENAME || file === `src/${_constants.MIDDLEWARE_FILENAME}`;
}
async function printTreeView(lists, pageInfos, serverless, { distPath , buildId , pagesDir , pageExtensions , buildManifest , appBuildManifest , middlewareManifest , useStatic404 , gzipSize =true  }) {
    var ref6;
    const getPrettySize = (_size)=>{
        const size = (0, _prettyBytes).default(_size);
        // green for 0-130kb
        if (_size < 130 * 1000) return _chalk.default.green(size);
        // yellow for 130-170kb
        if (_size < 170 * 1000) return _chalk.default.yellow(size);
        // red for >= 170kb
        return _chalk.default.red.bold(size);
    };
    const MIN_DURATION = 300;
    const getPrettyDuration = (_duration)=>{
        const duration = `${_duration} ms`;
        // green for 300-1000ms
        if (_duration < 1000) return _chalk.default.green(duration);
        // yellow for 1000-2000ms
        if (_duration < 2000) return _chalk.default.yellow(duration);
        // red for >= 2000ms
        return _chalk.default.red.bold(duration);
    };
    const getCleanName = (fileName)=>fileName// Trim off `static/`
        .replace(/^static\//, "")// Re-add `static/` for root files
        .replace(/^<buildId>/, "static")// Remove file hash
        .replace(/(?:^|[.-])([0-9a-z]{6})[0-9a-z]{14}(?=\.)/, ".$1");
    // Check if we have a custom app.
    const hasCustomApp = pagesDir && await (0, _findPageFile).findPageFile(pagesDir, "/_app", pageExtensions, false);
    const filterAndSortList = (list)=>list.slice().filter((e)=>!(e === "/_document" || e === "/_error" || !hasCustomApp && e === "/_app")).sort((a, b)=>a.localeCompare(b));
    // Collect all the symbols we use so we can print the icons out.
    const usedSymbols = new Set();
    const messages = [];
    const stats = await computeFromManifest({
        build: buildManifest,
        app: appBuildManifest
    }, distPath, gzipSize, pageInfos);
    const printFileTree = async ({ list , routerType  })=>{
        var ref7, ref3;
        messages.push([
            routerType === "app" ? "Route (app)" : "Route (pages)",
            "Size",
            "First Load JS", 
        ].map((entry)=>_chalk.default.underline(entry)));
        filterAndSortList(list).forEach((item, i, arr)=>{
            var ref8, ref4, ref5;
            const border = i === 0 ? arr.length === 1 ? "\u2500" : "\u250C" : i === arr.length - 1 ? "\u2514" : "\u251C";
            const pageInfo = pageInfos.get(item);
            const ampFirst = buildManifest.ampFirstPages.includes(item);
            const totalDuration = ((pageInfo == null ? void 0 : pageInfo.pageDuration) || 0) + ((pageInfo == null ? void 0 : (ref8 = pageInfo.ssgPageDurations) == null ? void 0 : ref8.reduce((a, b)=>a + (b || 0), 0)) || 0);
            const symbol = routerType === "app" || item === "/_app" || item === "/_app.server" ? " " : (pageInfo == null ? void 0 : pageInfo.static) ? "\u25CB" : (pageInfo == null ? void 0 : pageInfo.isSsg) ? "\u25CF" : (pageInfo == null ? void 0 : pageInfo.runtime) === _constants.SERVER_RUNTIME.edge ? "\u2107" : "\u03BB";
            usedSymbols.add(symbol);
            if (pageInfo == null ? void 0 : pageInfo.initialRevalidateSeconds) usedSymbols.add("ISR");
            messages.push([
                `${border} ${routerType === "pages" ? `${symbol} ` : ""}${(pageInfo == null ? void 0 : pageInfo.initialRevalidateSeconds) ? `${item} (ISR: ${pageInfo == null ? void 0 : pageInfo.initialRevalidateSeconds} Seconds)` : item}${totalDuration > MIN_DURATION ? ` (${getPrettyDuration(totalDuration)})` : ""}`,
                pageInfo ? ampFirst ? _chalk.default.cyan("AMP") : pageInfo.size >= 0 ? (0, _prettyBytes).default(pageInfo.size) : "" : "",
                pageInfo ? ampFirst ? _chalk.default.cyan("AMP") : pageInfo.size >= 0 ? getPrettySize(pageInfo.totalSize) : "" : "", 
            ]);
            const uniqueCssFiles = ((ref4 = buildManifest.pages[item]) == null ? void 0 : ref4.filter((file)=>{
                var ref;
                return file.endsWith(".css") && ((ref = stats.router[routerType]) == null ? void 0 : ref.unique.files.includes(file));
            })) || [];
            if (uniqueCssFiles.length > 0) {
                const contSymbol = i === arr.length - 1 ? " " : "\u251C";
                uniqueCssFiles.forEach((file, index, { length  })=>{
                    const innerSymbol = index === length - 1 ? "\u2514" : "\u251C";
                    const size = stats.sizes.get(file);
                    messages.push([
                        `${contSymbol}   ${innerSymbol} ${getCleanName(file)}`,
                        typeof size === "number" ? (0, _prettyBytes).default(size) : "",
                        "", 
                    ]);
                });
            }
            if (pageInfo == null ? void 0 : (ref5 = pageInfo.ssgPageRoutes) == null ? void 0 : ref5.length) {
                const totalRoutes = pageInfo.ssgPageRoutes.length;
                const contSymbol = i === arr.length - 1 ? " " : "\u251C";
                let routes;
                if (pageInfo.ssgPageDurations && pageInfo.ssgPageDurations.some((d)=>d > MIN_DURATION)) {
                    const previewPages = totalRoutes === 8 ? 8 : Math.min(totalRoutes, 7);
                    const routesWithDuration = pageInfo.ssgPageRoutes.map((route, idx)=>({
                            route,
                            duration: pageInfo.ssgPageDurations[idx] || 0
                        })).sort(({ duration: a  }, { duration: b  })=>// Sort by duration
                        // keep too small durations in original order at the end
                        a <= MIN_DURATION && b <= MIN_DURATION ? 0 : b - a);
                    routes = routesWithDuration.slice(0, previewPages);
                    const remainingRoutes = routesWithDuration.slice(previewPages);
                    if (remainingRoutes.length) {
                        const remaining = remainingRoutes.length;
                        const avgDuration = Math.round(remainingRoutes.reduce((total, { duration  })=>total + duration, 0) / remainingRoutes.length);
                        routes.push({
                            route: `[+${remaining} more paths]`,
                            duration: 0,
                            avgDuration
                        });
                    }
                } else {
                    const previewPages = totalRoutes === 4 ? 4 : Math.min(totalRoutes, 3);
                    routes = pageInfo.ssgPageRoutes.slice(0, previewPages).map((route)=>({
                            route,
                            duration: 0
                        }));
                    if (totalRoutes > previewPages) {
                        const remaining = totalRoutes - previewPages;
                        routes.push({
                            route: `[+${remaining} more paths]`,
                            duration: 0
                        });
                    }
                }
                routes.forEach(({ route , duration , avgDuration  }, index, { length  })=>{
                    const innerSymbol = index === length - 1 ? "\u2514" : "\u251C";
                    messages.push([
                        `${contSymbol}   ${innerSymbol} ${route}${duration > MIN_DURATION ? ` (${getPrettyDuration(duration)})` : ""}${avgDuration && avgDuration > MIN_DURATION ? ` (avg ${getPrettyDuration(avgDuration)})` : ""}`,
                        "",
                        "", 
                    ]);
                });
            }
        });
        const sharedFilesSize = (ref7 = stats.router[routerType]) == null ? void 0 : ref7.common.size.total;
        var _files;
        const sharedFiles = (_files = (ref3 = stats.router[routerType]) == null ? void 0 : ref3.common.files) != null ? _files : [];
        messages.push([
            "+ First Load JS shared by all",
            typeof sharedFilesSize === "number" ? getPrettySize(sharedFilesSize) : "",
            "", 
        ]);
        const sharedCssFiles = [];
        [
            ...sharedFiles.filter((file)=>{
                if (file.endsWith(".css")) {
                    sharedCssFiles.push(file);
                    return false;
                }
                return true;
            }).map((e)=>e.replace(buildId, "<buildId>")).sort(),
            ...sharedCssFiles.map((e)=>e.replace(buildId, "<buildId>")).sort(), 
        ].forEach((fileName, index, { length  })=>{
            const innerSymbol = index === length - 1 ? "\u2514" : "\u251C";
            const originalName = fileName.replace("<buildId>", buildId);
            const cleanName = getCleanName(fileName);
            const size = stats.sizes.get(originalName);
            messages.push([
                `  ${innerSymbol} ${cleanName}`,
                typeof size === "number" ? (0, _prettyBytes).default(size) : "",
                "", 
            ]);
        });
    };
    // If enabled, then print the tree for the app directory.
    if (lists.app && stats.router.app) {
        await printFileTree({
            routerType: "app",
            list: lists.app
        });
        messages.push([
            "",
            "",
            ""
        ]);
    }
    pageInfos.set("/404", {
        ...pageInfos.get("/404") || pageInfos.get("/_error"),
        static: useStatic404
    });
    if (!lists.pages.includes("/404")) {
        lists.pages = [
            ...lists.pages,
            "/404"
        ];
    }
    // Print the tree view for the pages directory.
    await printFileTree({
        routerType: "pages",
        list: lists.pages
    });
    const middlewareInfo = (ref6 = middlewareManifest.middleware) == null ? void 0 : ref6["/"];
    if ((middlewareInfo == null ? void 0 : middlewareInfo.files.length) > 0) {
        const middlewareSizes = await Promise.all(middlewareInfo.files.map((dep)=>`${distPath}/${dep}`).map(gzipSize ? fsStatGzip : fsStat));
        messages.push([
            "",
            "",
            ""
        ]);
        messages.push([
            "\u0192 Middleware",
            getPrettySize(sum(middlewareSizes)),
            ""
        ]);
    }
    console.log((0, _textTable).default(messages, {
        align: [
            "l",
            "l",
            "r"
        ],
        stringLength: (str)=>(0, _stripAnsi).default(str).length
    }));
    console.log();
    console.log((0, _textTable).default([
        usedSymbols.has("\u2107") && [
            "\u2107",
            "(Streaming)",
            `server-side renders with streaming (uses React 18 SSR streaming or Server Components)`, 
        ],
        usedSymbols.has("\u03BB") && [
            "\u03BB",
            serverless ? "(Lambda)" : "(Server)",
            `server-side renders at runtime (uses ${_chalk.default.cyan("getInitialProps")} or ${_chalk.default.cyan("getServerSideProps")})`, 
        ],
        usedSymbols.has("\u25CB") && [
            "\u25CB",
            "(Static)",
            "automatically rendered as static HTML (uses no initial props)", 
        ],
        usedSymbols.has("\u25CF") && [
            "\u25CF",
            "(SSG)",
            `automatically generated as static HTML + JSON (uses ${_chalk.default.cyan("getStaticProps")})`, 
        ],
        usedSymbols.has("ISR") && [
            "",
            "(ISR)",
            `incremental static regeneration (uses revalidate in ${_chalk.default.cyan("getStaticProps")})`, 
        ], 
    ].filter((x)=>x), {
        align: [
            "l",
            "l",
            "l"
        ],
        stringLength: (str)=>(0, _stripAnsi).default(str).length
    }));
    console.log();
}
function printCustomRoutes({ redirects , rewrites , headers  }) {
    const printRoutes = (routes, type)=>{
        const isRedirects = type === "Redirects";
        const isHeaders = type === "Headers";
        console.log(_chalk.default.underline(type));
        console.log();
        /*
        ┌ source
        ├ permanent/statusCode
        └ destination
     */ const routesStr = routes.map((route)=>{
            let routeStr = `┌ source: ${route.source}\n`;
            if (!isHeaders) {
                const r = route;
                routeStr += `${isRedirects ? "\u251C" : "\u2514"} destination: ${r.destination}\n`;
            }
            if (isRedirects) {
                const r = route;
                routeStr += `└ ${r.statusCode ? `status: ${r.statusCode}` : `permanent: ${r.permanent}`}\n`;
            }
            if (isHeaders) {
                const r = route;
                routeStr += `└ headers:\n`;
                for(let i = 0; i < r.headers.length; i++){
                    const header = r.headers[i];
                    const last = i === headers.length - 1;
                    routeStr += `  ${last ? "\u2514" : "\u251C"} ${header.key}: ${header.value}\n`;
                }
            }
            return routeStr;
        }).join("\n");
        console.log(routesStr, "\n");
    };
    if (redirects.length) {
        printRoutes(redirects, "Redirects");
    }
    if (headers.length) {
        printRoutes(headers, "Headers");
    }
    const combinedRewrites = [
        ...rewrites.beforeFiles,
        ...rewrites.afterFiles,
        ...rewrites.fallback, 
    ];
    if (combinedRewrites.length) {
        printRoutes(combinedRewrites, "Rewrites");
    }
}
async function getJsPageSizeInKb(routerType, page, distPath, buildManifest, appBuildManifest, gzipSize = true, cachedStats) {
    const pageManifest = routerType === "pages" ? buildManifest : appBuildManifest;
    if (!pageManifest) {
        throw new Error('expected appBuildManifest with an "app" pageType');
    }
    // If stats was not provided, then compute it again.
    const stats = cachedStats != null ? cachedStats : await computeFromManifest({
        build: buildManifest,
        app: appBuildManifest
    }, distPath, gzipSize);
    const pageData = stats.router[routerType];
    if (!pageData) {
        // This error shouldn't happen and represents an error in Next.js.
        throw new Error('expected "app" manifest data with an "app" pageType');
    }
    const pagePath = routerType === "pages" ? (0, _denormalizePagePath).denormalizePagePath(page) : denormalizeAppPagePath(page);
    const fnFilterJs = (entry)=>entry.endsWith(".js");
    var _pagePath;
    const pageFiles = ((_pagePath = pageManifest.pages[pagePath]) != null ? _pagePath : []).filter(fnFilterJs);
    var ref;
    const appFiles = ((ref = pageManifest.pages["/_app"]) != null ? ref : []).filter(fnFilterJs);
    const fnMapRealPath = (dep)=>`${distPath}/${dep}`;
    const allFilesReal = unique(pageFiles, appFiles).map(fnMapRealPath);
    const selfFilesReal = difference(// Find the files shared by the pages files and the unique files...
    intersect(pageFiles, pageData.unique.files), // but without the common files.
    pageData.common.files).map(fnMapRealPath);
    const getSize = gzipSize ? fsStatGzip : fsStat;
    // Try to get the file size from the page data if available, otherwise do a
    // raw compute.
    const getCachedSize = async (file)=>{
        const key = file.slice(distPath.length + 1);
        const size = stats.sizes.get(key);
        // If the size wasn't in the stats bundle, then get it from the file
        // directly.
        if (typeof size !== "number") {
            return getSize(file);
        }
        return size;
    };
    try {
        // Doesn't use `Promise.all`, as we'd double compute duplicate files. This
        // function is memoized, so the second one will instantly resolve.
        const allFilesSize = sum(await Promise.all(allFilesReal.map(getCachedSize)));
        const selfFilesSize = sum(await Promise.all(selfFilesReal.map(getCachedSize)));
        return [
            selfFilesSize,
            allFilesSize
        ];
    } catch  {}
    return [
        -1,
        -1
    ];
}
async function buildStaticPaths({ page , getStaticPaths , staticPathsResult , configFileName , locales , defaultLocale  }) {
    const prerenderPaths = new Set();
    const encodedPrerenderPaths = new Set();
    const _routeRegex1 = (0, _routeRegex).getRouteRegex(page);
    const _routeMatcher1 = (0, _routeMatcher).getRouteMatcher(_routeRegex1);
    // Get the default list of allowed params.
    const _validParamKeys = Object.keys(_routeMatcher1(page));
    if (!staticPathsResult) {
        if (getStaticPaths) {
            staticPathsResult = await getStaticPaths({
                locales,
                defaultLocale
            });
        } else {
            throw new Error(`invariant: attempted to buildStaticPaths without "staticPathsResult" or "getStaticPaths" ${page}`);
        }
    }
    const expectedReturnVal = `Expected: { paths: [], fallback: boolean }\n` + `See here for more info: https://nextjs.org/docs/messages/invalid-getstaticpaths-value`;
    if (!staticPathsResult || typeof staticPathsResult !== "object" || Array.isArray(staticPathsResult)) {
        throw new Error(`Invalid value returned from getStaticPaths in ${page}. Received ${typeof staticPathsResult} ${expectedReturnVal}`);
    }
    const invalidStaticPathKeys = Object.keys(staticPathsResult).filter((key)=>!(key === "paths" || key === "fallback"));
    if (invalidStaticPathKeys.length > 0) {
        throw new Error(`Extra keys returned from getStaticPaths in ${page} (${invalidStaticPathKeys.join(", ")}) ${expectedReturnVal}`);
    }
    if (!(typeof staticPathsResult.fallback === "boolean" || staticPathsResult.fallback === "blocking")) {
        throw new Error(`The \`fallback\` key must be returned from getStaticPaths in ${page}.\n` + expectedReturnVal);
    }
    const toPrerender = staticPathsResult.paths;
    if (!Array.isArray(toPrerender)) {
        throw new Error(`Invalid \`paths\` value returned from getStaticPaths in ${page}.\n` + `\`paths\` must be an array of strings or objects of shape { params: [key: string]: string }`);
    }
    toPrerender.forEach((entry)=>{
        // For a string-provided path, we must make sure it matches the dynamic
        // route.
        if (typeof entry === "string") {
            entry = (0, _removeTrailingSlash).removeTrailingSlash(entry);
            const localePathResult = (0, _normalizeLocalePath).normalizeLocalePath(entry, locales);
            let cleanedEntry = entry;
            if (localePathResult.detectedLocale) {
                cleanedEntry = entry.slice(localePathResult.detectedLocale.length + 1);
            } else if (defaultLocale) {
                entry = `/${defaultLocale}${entry}`;
            }
            const result = _routeMatcher1(cleanedEntry);
            if (!result) {
                throw new Error(`The provided path \`${cleanedEntry}\` does not match the page: \`${page}\`.`);
            }
            // If leveraging the string paths variant the entry should already be
            // encoded so we decode the segments ensuring we only escape path
            // delimiters
            prerenderPaths.add(entry.split("/").map((segment)=>(0, _escapePathDelimiters).default(decodeURIComponent(segment), true)).join("/"));
            encodedPrerenderPaths.add(entry);
        } else {
            const invalidKeys = Object.keys(entry).filter((key)=>key !== "params" && key !== "locale");
            if (invalidKeys.length) {
                throw new Error(`Additional keys were returned from \`getStaticPaths\` in page "${page}". ` + `URL Parameters intended for this dynamic route must be nested under the \`params\` key, i.e.:` + `\n\n\treturn { params: { ${_validParamKeys.map((k)=>`${k}: ...`).join(", ")} } }` + `\n\nKeys that need to be moved: ${invalidKeys.join(", ")}.\n`);
            }
            const { params ={}  } = entry;
            let builtPage = page;
            let encodedBuiltPage = page;
            _validParamKeys.forEach((validParamKey)=>{
                const { repeat , optional  } = _routeRegex1.groups[validParamKey];
                let paramValue = params[validParamKey];
                if (optional && params.hasOwnProperty(validParamKey) && (paramValue === null || paramValue === undefined || paramValue === false)) {
                    paramValue = [];
                }
                if (repeat && !Array.isArray(paramValue) || !repeat && typeof paramValue !== "string") {
                    throw new Error(`A required parameter (${validParamKey}) was not provided as ${repeat ? "an array" : "a string"} in getStaticPaths for ${page}`);
                }
                let replaced = `[${repeat ? "..." : ""}${validParamKey}]`;
                if (optional) {
                    replaced = `[${replaced}]`;
                }
                builtPage = builtPage.replace(replaced, repeat ? paramValue.map((segment)=>(0, _escapePathDelimiters).default(segment, true)).join("/") : (0, _escapePathDelimiters).default(paramValue, true)).replace(/(?!^)\/$/, "");
                encodedBuiltPage = encodedBuiltPage.replace(replaced, repeat ? paramValue.map(encodeURIComponent).join("/") : encodeURIComponent(paramValue)).replace(/(?!^)\/$/, "");
            });
            if (entry.locale && !(locales == null ? void 0 : locales.includes(entry.locale))) {
                throw new Error(`Invalid locale returned from getStaticPaths for ${page}, the locale ${entry.locale} is not specified in ${configFileName}`);
            }
            const curLocale = entry.locale || defaultLocale || "";
            prerenderPaths.add(`${curLocale ? `/${curLocale}` : ""}${curLocale && builtPage === "/" ? "" : builtPage}`);
            encodedPrerenderPaths.add(`${curLocale ? `/${curLocale}` : ""}${curLocale && encodedBuiltPage === "/" ? "" : encodedBuiltPage}`);
        }
    });
    return {
        paths: [
            ...prerenderPaths
        ],
        fallback: staticPathsResult.fallback,
        encodedPaths: [
            ...encodedPrerenderPaths
        ]
    };
}
const collectGenerateParams = (segment, parentSegments = [], generateParams = [])=>{
    var ref, ref9, ref10, ref11;
    if (!Array.isArray(segment)) return generateParams;
    const isLayout = !!((ref = segment[2]) == null ? void 0 : ref.layout);
    const mod = isLayout ? (ref9 = segment[2]) == null ? void 0 : ref9.layout == null ? void 0 : ref9.layout() : (ref10 = segment[2]) == null ? void 0 : ref10.page == null ? void 0 : ref10.page();
    const result = {
        isLayout,
        segmentPath: `/${parentSegments.join("/")}${segment[0] && parentSegments.length > 0 ? "/" : ""}${segment[0]}`,
        config: mod == null ? void 0 : mod.config,
        getStaticPaths: mod == null ? void 0 : mod.getStaticPaths,
        generateStaticParams: mod == null ? void 0 : mod.generateStaticParams
    };
    if (segment[0]) {
        parentSegments.push(segment[0]);
    }
    if (result.config || result.generateStaticParams || result.getStaticPaths) {
        generateParams.push(result);
    }
    return collectGenerateParams((ref11 = segment[1]) == null ? void 0 : ref11.children, parentSegments, generateParams);
};
exports.collectGenerateParams = collectGenerateParams;
async function buildAppStaticPaths({ page , configFileName , generateParams  }) {
    const pageEntry = generateParams[generateParams.length - 1];
    // if the page has legacy getStaticPaths we call it like normal
    if (typeof (pageEntry == null ? void 0 : pageEntry.getStaticPaths) === "function") {
        return buildStaticPaths({
            page,
            configFileName,
            getStaticPaths: pageEntry.getStaticPaths
        });
    } else {
        let hadGenerateParams = false;
        const buildParams = async (paramsItems = [
            {}
        ], idx = 0)=>{
            const curGenerate = generateParams[idx];
            if (idx === generateParams.length) {
                return paramsItems;
            }
            if (typeof curGenerate.generateStaticParams !== "function" && idx < generateParams.length) {
                return buildParams(paramsItems, idx + 1);
            }
            hadGenerateParams = true;
            const newParams = [];
            for (const params of paramsItems){
                const result = await curGenerate.generateStaticParams({
                    params
                });
                // TODO: validate the result is valid here or wait for
                // buildStaticPaths to validate?
                for (const item of result.params){
                    newParams.push({
                        ...params,
                        ...item
                    });
                }
            }
            if (idx < generateParams.length) {
                return buildParams(newParams, idx + 1);
            }
            return newParams;
        };
        const builtParams = await buildParams();
        const fallback = !generateParams.some(// TODO: check complementary configs that can impact
        // dynamicParams behavior
        (generate)=>{
            var ref;
            return ((ref = generate.config) == null ? void 0 : ref.dynamicParams) === false;
        });
        if (!hadGenerateParams) {
            return {
                paths: undefined,
                fallback: undefined,
                encodedPaths: undefined
            };
        }
        return buildStaticPaths({
            staticPathsResult: {
                fallback,
                paths: builtParams.map((params)=>({
                        params
                    }))
            },
            page,
            configFileName
        });
    }
}
async function isPageStatic({ page , distDir , serverless , configFileName , runtimeEnvConfig , httpAgentOptions , locales , defaultLocale , parentId , pageRuntime , edgeInfo , pageType , hasServerComponents , originalAppPath  }) {
    const isPageStaticSpan = (0, _trace).trace("is-page-static-utils", parentId);
    return isPageStaticSpan.traceAsyncFn(async ()=>{
        require("../shared/lib/runtime-config").setConfig(runtimeEnvConfig);
        (0, _config).setHttpAgentOptions(httpAgentOptions);
        let componentsResult;
        let prerenderRoutes;
        let encodedPrerenderRoutes;
        let prerenderFallback;
        let appConfig = {};
        if (pageRuntime === _constants.SERVER_RUNTIME.edge) {
            const runtime = await (0, _sandbox).getRuntimeContext({
                paths: edgeInfo.files.map((file)=>_path.default.join(distDir, file)),
                env: edgeInfo.env,
                edgeFunctionEntry: edgeInfo,
                name: edgeInfo.name,
                useCache: true,
                distDir
            });
            const mod = runtime.context._ENTRIES[`middleware_${edgeInfo.name}`].ComponentMod;
            componentsResult = {
                Component: mod.default,
                ComponentMod: mod,
                pageConfig: mod.config || {},
                // @ts-expect-error this is not needed during require
                buildManifest: {},
                reactLoadableManifest: {},
                getServerSideProps: mod.getServerSideProps,
                getStaticPaths: mod.getStaticPaths,
                getStaticProps: mod.getStaticProps
            };
        } else {
            componentsResult = await (0, _loadComponents).loadComponents({
                distDir,
                pathname: originalAppPath || page,
                serverless,
                hasServerComponents: !!hasServerComponents,
                isAppPath: pageType === "app"
            });
        }
        const Comp = componentsResult.Component || {};
        let staticPathsResult;
        if (pageType === "app") {
            const tree = componentsResult.ComponentMod.tree;
            const generateParams = collectGenerateParams(tree);
            appConfig = generateParams.reduce((builtConfig, curGenParams)=>{
                const { dynamic , fetchCache , preferredRegion , revalidate: curRevalidate ,  } = (curGenParams == null ? void 0 : curGenParams.config) || {};
                // TODO: should conflicting configs here throw an error
                // e.g. if layout defines one region but page defines another
                if (typeof builtConfig.preferredRegion === "undefined") {
                    builtConfig.preferredRegion = preferredRegion;
                }
                if (typeof builtConfig.dynamic === "undefined") {
                    builtConfig.dynamic = dynamic;
                }
                if (typeof builtConfig.fetchCache === "undefined") {
                    builtConfig.fetchCache = fetchCache;
                }
                // any revalidate number overrides false
                // shorter revalidate overrides longer (initially)
                if (typeof builtConfig.revalidate === "undefined") {
                    builtConfig.revalidate = curRevalidate;
                }
                if (typeof curRevalidate === "number" && (typeof builtConfig.revalidate !== "number" || curRevalidate < builtConfig.revalidate)) {
                    builtConfig.revalidate = curRevalidate;
                }
                return builtConfig;
            }, {});
            if ((0, _isDynamic).isDynamicRoute(page)) {
                ({ paths: prerenderRoutes , fallback: prerenderFallback , encodedPaths: encodedPrerenderRoutes ,  } = await buildAppStaticPaths({
                    page,
                    configFileName,
                    generateParams
                }));
            }
        } else {
            if (!Comp || !(0, _reactIs).isValidElementType(Comp) || typeof Comp === "string") {
                throw new Error("INVALID_DEFAULT_EXPORT");
            }
        }
        const hasGetInitialProps = !!Comp.getInitialProps;
        const hasStaticProps = !!componentsResult.getStaticProps;
        const hasStaticPaths = !!componentsResult.getStaticPaths;
        const hasServerProps = !!componentsResult.getServerSideProps;
        const hasLegacyServerProps = !!await componentsResult.ComponentMod.unstable_getServerProps;
        const hasLegacyStaticProps = !!await componentsResult.ComponentMod.unstable_getStaticProps;
        const hasLegacyStaticPaths = !!await componentsResult.ComponentMod.unstable_getStaticPaths;
        const hasLegacyStaticParams = !!await componentsResult.ComponentMod.unstable_getStaticParams;
        if (hasLegacyStaticParams) {
            throw new Error(`unstable_getStaticParams was replaced with getStaticPaths. Please update your code.`);
        }
        if (hasLegacyStaticPaths) {
            throw new Error(`unstable_getStaticPaths was replaced with getStaticPaths. Please update your code.`);
        }
        if (hasLegacyStaticProps) {
            throw new Error(`unstable_getStaticProps was replaced with getStaticProps. Please update your code.`);
        }
        if (hasLegacyServerProps) {
            throw new Error(`unstable_getServerProps was replaced with getServerSideProps. Please update your code.`);
        }
        // A page cannot be prerendered _and_ define a data requirement. That's
        // contradictory!
        if (hasGetInitialProps && hasStaticProps) {
            throw new Error(_constants.SSG_GET_INITIAL_PROPS_CONFLICT);
        }
        if (hasGetInitialProps && hasServerProps) {
            throw new Error(_constants.SERVER_PROPS_GET_INIT_PROPS_CONFLICT);
        }
        if (hasStaticProps && hasServerProps) {
            throw new Error(_constants.SERVER_PROPS_SSG_CONFLICT);
        }
        const pageIsDynamic = (0, _isDynamic).isDynamicRoute(page);
        // A page cannot have static parameters if it is not a dynamic page.
        if (hasStaticProps && hasStaticPaths && !pageIsDynamic) {
            throw new Error(`getStaticPaths can only be used with dynamic pages, not '${page}'.` + `\nLearn more: https://nextjs.org/docs/routing/dynamic-routes`);
        }
        if (hasStaticProps && pageIsDynamic && !hasStaticPaths) {
            throw new Error(`getStaticPaths is required for dynamic SSG pages and is missing for '${page}'.` + `\nRead more: https://nextjs.org/docs/messages/invalid-getstaticpaths-value`);
        }
        if (hasStaticProps && hasStaticPaths || staticPathsResult) {
            ({ paths: prerenderRoutes , fallback: prerenderFallback , encodedPaths: encodedPrerenderRoutes ,  } = await buildStaticPaths({
                page,
                locales,
                defaultLocale,
                configFileName,
                staticPathsResult,
                getStaticPaths: componentsResult.getStaticPaths
            }));
        }
        const isNextImageImported = global.__NEXT_IMAGE_IMPORTED;
        const config = componentsResult.pageConfig;
        return {
            isStatic: !hasStaticProps && !hasGetInitialProps && !hasServerProps,
            isHybridAmp: config.amp === "hybrid",
            isAmpOnly: config.amp === true,
            prerenderRoutes,
            prerenderFallback,
            encodedPrerenderRoutes,
            hasStaticProps,
            hasServerProps,
            isNextImageImported,
            traceIncludes: config.unstable_includeFiles || [],
            traceExcludes: config.unstable_excludeFiles || [],
            appConfig
        };
    }).catch((err)=>{
        if (err.message === "INVALID_DEFAULT_EXPORT") {
            throw err;
        }
        console.error(err);
        throw new Error(`Failed to collect page data for ${page}`);
    });
}
async function hasCustomGetInitialProps(page, distDir, isLikeServerless, runtimeEnvConfig, checkingApp) {
    require("../shared/lib/runtime-config").setConfig(runtimeEnvConfig);
    const components = await (0, _loadComponents).loadComponents({
        distDir,
        pathname: page,
        serverless: isLikeServerless,
        hasServerComponents: false,
        isAppPath: false
    });
    let mod = components.ComponentMod;
    if (checkingApp) {
        mod = await mod._app || mod.default || mod;
    } else {
        mod = mod.default || mod;
    }
    mod = await mod;
    return mod.getInitialProps !== mod.origGetInitialProps;
}
async function getNamedExports(page, distDir, isLikeServerless, runtimeEnvConfig) {
    require("../shared/lib/runtime-config").setConfig(runtimeEnvConfig);
    const components = await (0, _loadComponents).loadComponents({
        distDir,
        pathname: page,
        serverless: isLikeServerless,
        hasServerComponents: false,
        isAppPath: false
    });
    let mod = components.ComponentMod;
    return Object.keys(mod);
}
function detectConflictingPaths(combinedPages, ssgPages, additionalSsgPaths) {
    const conflictingPaths = new Map();
    const dynamicSsgPages = [
        ...ssgPages
    ].filter((page)=>(0, _isDynamic).isDynamicRoute(page));
    additionalSsgPaths.forEach((paths, pathsPage)=>{
        paths.forEach((curPath)=>{
            const lowerPath = curPath.toLowerCase();
            let conflictingPage = combinedPages.find((page)=>page.toLowerCase() === lowerPath);
            if (conflictingPage) {
                conflictingPaths.set(lowerPath, [
                    {
                        path: curPath,
                        page: pathsPage
                    },
                    {
                        path: conflictingPage,
                        page: conflictingPage
                    }, 
                ]);
            } else {
                let conflictingPath;
                conflictingPage = dynamicSsgPages.find((page)=>{
                    var ref;
                    if (page === pathsPage) return false;
                    conflictingPath = (ref = additionalSsgPaths.get(page)) == null ? void 0 : ref.find((compPath)=>compPath.toLowerCase() === lowerPath);
                    return conflictingPath;
                });
                if (conflictingPage && conflictingPath) {
                    conflictingPaths.set(lowerPath, [
                        {
                            path: curPath,
                            page: pathsPage
                        },
                        {
                            path: conflictingPath,
                            page: conflictingPage
                        }, 
                    ]);
                }
            }
        });
    });
    if (conflictingPaths.size > 0) {
        let conflictingPathsOutput = "";
        conflictingPaths.forEach((pathItems)=>{
            pathItems.forEach((pathItem, idx)=>{
                const isDynamic = pathItem.page !== pathItem.path;
                if (idx > 0) {
                    conflictingPathsOutput += "conflicts with ";
                }
                conflictingPathsOutput += `path: "${pathItem.path}"${isDynamic ? ` from page: "${pathItem.page}" ` : " "}`;
            });
            conflictingPathsOutput += "\n";
        });
        Log.error("Conflicting paths returned from getStaticPaths, paths must be unique per page.\n" + "See more info here: https://nextjs.org/docs/messages/conflicting-ssg-paths\n\n" + conflictingPathsOutput);
        process.exit(1);
    }
}
async function copyTracedFiles(dir, distDir, pageKeys, tracingRoot, serverConfig, middlewareManifest) {
    const outputPath = _path.default.join(distDir, "standalone");
    const copiedFiles = new Set();
    await (0, _recursiveDelete).recursiveDelete(outputPath);
    async function handleTraceFiles(traceFilePath) {
        const traceData = JSON.parse(await _fs.promises.readFile(traceFilePath, "utf8"));
        const copySema = new _asyncSema.Sema(10, {
            capacity: traceData.files.length
        });
        const traceFileDir = _path.default.dirname(traceFilePath);
        await Promise.all(traceData.files.map(async (relativeFile)=>{
            await copySema.acquire();
            const tracedFilePath = _path.default.join(traceFileDir, relativeFile);
            const fileOutputPath = _path.default.join(outputPath, _path.default.relative(tracingRoot, tracedFilePath));
            if (!copiedFiles.has(fileOutputPath)) {
                copiedFiles.add(fileOutputPath);
                await _fs.promises.mkdir(_path.default.dirname(fileOutputPath), {
                    recursive: true
                });
                const symlink = await _fs.promises.readlink(tracedFilePath).catch(()=>null);
                if (symlink) {
                    try {
                        await _fs.promises.symlink(symlink, fileOutputPath);
                    } catch (e) {
                        if (e.code !== "EEXIST") {
                            throw e;
                        }
                    }
                } else {
                    await _fs.promises.copyFile(tracedFilePath, fileOutputPath);
                }
            }
            await copySema.release();
        }));
    }
    for (const middleware of Object.values(middlewareManifest.middleware) || []){
        if (isMiddlewareFilename(middleware.name)) {
            for (const file of middleware.files){
                const originalPath = _path.default.join(distDir, file);
                const fileOutputPath = _path.default.join(outputPath, _path.default.relative(tracingRoot, distDir), file);
                await _fs.promises.mkdir(_path.default.dirname(fileOutputPath), {
                    recursive: true
                });
                await _fs.promises.copyFile(originalPath, fileOutputPath);
            }
        }
    }
    for (const page of pageKeys){
        const pageFile = _path.default.join(distDir, "server", "pages", `${(0, _normalizePagePath).normalizePagePath(page)}.js`);
        const pageTraceFile = `${pageFile}.nft.json`;
        await handleTraceFiles(pageTraceFile);
    }
    await handleTraceFiles(_path.default.join(distDir, "next-server.js.nft.json"));
    const serverOutputPath = _path.default.join(outputPath, _path.default.relative(tracingRoot, dir), "server.js");
    await _fs.promises.writeFile(serverOutputPath, `
process.env.NODE_ENV = 'production'
process.chdir(__dirname)
const NextServer = require('next/dist/server/next-server').default
const http = require('http')
const path = require('path')

// Make sure commands gracefully respect termination signals (e.g. from Docker)
// Allow the graceful termination to be manually configurable
if (!process.env.NEXT_MANUAL_SIG_HANDLE) {
  process.on('SIGTERM', () => process.exit(0))
  process.on('SIGINT', () => process.exit(0))
}

let handler

const server = http.createServer(async (req, res) => {
  try {
    await handler(req, res)
  } catch (err) {
    console.error(err);
    res.statusCode = 500
    res.end('internal server error')
  }
})
const currentPort = parseInt(process.env.PORT, 10) || 3000

server.listen(currentPort, (err) => {
  if (err) {
    console.error("Failed to start server", err)
    process.exit(1)
  }
  const nextServer = new NextServer({
    hostname: 'localhost',
    port: currentPort,
    dir: path.join(__dirname),
    dev: false,
    customServer: false,
    conf: ${JSON.stringify({
        ...serverConfig,
        distDir: `./${_path.default.relative(dir, distDir)}`
    })},
  })
  handler = nextServer.getRequestHandler()

  console.log("Listening on port", currentPort)
})
    `);
}
function isReservedPage(page) {
    return RESERVED_PAGE.test(page);
}
function isCustomErrorPage(page) {
    return page === "/404" || page === "/500";
}
function isMiddlewareFile(file) {
    return file === `/${_constants.MIDDLEWARE_FILENAME}` || file === `/src/${_constants.MIDDLEWARE_FILENAME}`;
}
function getPossibleMiddlewareFilenames(folder, extensions) {
    return extensions.map((extension)=>_path.default.join(folder, `${_constants.MIDDLEWARE_FILENAME}.${extension}`));
}
class MiddlewareInServerlessTargetError extends Error {
    constructor(){
        super("Next.js Middleware is not supported in the deprecated serverless target.\n" + 'Please remove `target: "serverless" from your next.config.js to use Middleware.');
        this.name = "MiddlewareInServerlessTargetError";
    }
}
exports.MiddlewareInServerlessTargetError = MiddlewareInServerlessTargetError;
class NestedMiddlewareError extends Error {
    constructor(nestedFileNames, mainDir, pagesDir){
        super(`Nested Middleware is not allowed, found:\n` + `${nestedFileNames.map((file)=>`pages${file}`).join("\n")}\n` + `Please move your code to a single file at ${_path.default.join(_path.default.posix.sep, _path.default.relative(mainDir, _path.default.resolve(pagesDir, "..")), "middleware")} instead.\n` + `Read More - https://nextjs.org/docs/messages/nested-middleware`);
    }
}
exports.NestedMiddlewareError = NestedMiddlewareError;

//# sourceMappingURL=utils.js.map