"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _fileSystemCache = _interopRequireDefault(require("./file-system-cache"));
var _path = _interopRequireDefault(require("../../../shared/lib/isomorphic/path"));
var _normalizePagePath = require("../../../shared/lib/page-path/normalize-page-path");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function toRoute(pathname) {
    return pathname.replace(/\/$/, "").replace(/\/index$/, "") || "/";
}
class CacheHandler {
    // eslint-disable-next-line
    constructor(_ctx){}
    async get(_key) {
        return {};
    }
    async set(_key, _data) {}
}
exports.CacheHandler = CacheHandler;
class IncrementalCache {
    constructor({ fs , dev , appDir , flushToDisk , serverDistDir , maxMemoryCacheSize , getPrerenderManifest , incrementalCacheHandlerPath  }){
        let cacheHandlerMod = _fileSystemCache.default;
        if (process.env.NEXT_RUNTIME !== "edge" && incrementalCacheHandlerPath) {
            cacheHandlerMod = require(incrementalCacheHandlerPath);
            cacheHandlerMod = cacheHandlerMod.default || cacheHandlerMod;
        }
        if (process.env.__NEXT_TEST_MAX_ISR_CACHE) {
            // Allow cache size to be overridden for testing purposes
            maxMemoryCacheSize = parseInt(process.env.__NEXT_TEST_MAX_ISR_CACHE, 10);
        }
        this.dev = dev;
        this.prerenderManifest = getPrerenderManifest();
        this.cacheHandler = new cacheHandlerMod({
            dev,
            fs,
            flushToDisk,
            serverDistDir,
            maxMemoryCacheSize,
            _appDir: appDir
        });
    }
    calculateRevalidate(pathname, fromTime) {
        // in development we don't have a prerender-manifest
        // and default to always revalidating to allow easier debugging
        if (this.dev) return new Date().getTime() - 1000;
        // if an entry isn't present in routes we fallback to a default
        // of revalidating after 1 second
        const { initialRevalidateSeconds  } = this.prerenderManifest.routes[toRoute(pathname)] || {
            initialRevalidateSeconds: 1
        };
        const revalidateAfter = typeof initialRevalidateSeconds === "number" ? initialRevalidateSeconds * 1000 + fromTime : initialRevalidateSeconds;
        return revalidateAfter;
    }
    _getPathname(pathname) {
        return (0, _normalizePagePath).normalizePagePath(pathname);
    }
    // get data from cache if available
    async get(pathname) {
        var ref;
        // we don't leverage the prerender cache in dev mode
        // so that getStaticProps is always called for easier debugging
        if (this.dev) return null;
        pathname = this._getPathname(pathname);
        let entry = null;
        const cacheData = await this.cacheHandler.get(pathname);
        const curRevalidate = (ref = this.prerenderManifest.routes[toRoute(pathname)]) == null ? void 0 : ref.initialRevalidateSeconds;
        const revalidateAfter = this.calculateRevalidate(pathname, (cacheData == null ? void 0 : cacheData.lastModified) || Date.now());
        const isStale = revalidateAfter !== false && revalidateAfter < Date.now() ? true : undefined;
        if (cacheData) {
            entry = {
                isStale,
                curRevalidate,
                revalidateAfter,
                value: cacheData.value
            };
        }
        if (!cacheData && this.prerenderManifest.notFoundRoutes.includes(pathname)) {
            // for the first hit after starting the server the cache
            // may not have a way to save notFound: true so if
            // the prerender-manifest marks this as notFound then we
            // return that entry and trigger a cache set to give it a
            // chance to update in-memory entries
            entry = {
                isStale,
                value: null,
                curRevalidate,
                revalidateAfter
            };
            this.set(pathname, entry.value, curRevalidate);
        }
        return entry;
    }
    // populate the incremental cache with new data
    async set(pathname, data, revalidateSeconds) {
        if (this.dev) return;
        pathname = this._getPathname(pathname);
        try {
            // we use the prerender manifest memory instance
            // to store revalidate timings for calculating
            // revalidateAfter values so we update this on set
            if (typeof revalidateSeconds !== "undefined") {
                this.prerenderManifest.routes[pathname] = {
                    dataRoute: _path.default.posix.join("/_next/data", `${(0, _normalizePagePath).normalizePagePath(pathname)}.json`),
                    srcRoute: null,
                    initialRevalidateSeconds: revalidateSeconds
                };
            }
            await this.cacheHandler.set(pathname, data);
        } catch (error) {
            console.warn("Failed to update prerender cache for", pathname, error);
        }
    }
}
exports.IncrementalCache = IncrementalCache;

//# sourceMappingURL=index.js.map