"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
class WebResponseCache {
    constructor(minimalMode){
        this.pendingResponses = new Map();
        this.minimalMode = minimalMode;
    }
    get(key, responseGenerator, context) {
        var ref;
        // ensure manual revalidate doesn't block normal requests
        const pendingResponseKey = key ? `${key}-${context.isManualRevalidate ? "1" : "0"}` : null;
        const pendingResponse = pendingResponseKey ? this.pendingResponses.get(pendingResponseKey) : null;
        if (pendingResponse) {
            return pendingResponse;
        }
        let resolver = ()=>{};
        let rejecter = ()=>{};
        const promise = new Promise((resolve, reject)=>{
            resolver = resolve;
            rejecter = reject;
        });
        if (pendingResponseKey) {
            this.pendingResponses.set(pendingResponseKey, promise);
        }
        let resolved = false;
        const resolve1 = (cacheEntry)=>{
            if (pendingResponseKey) {
                // Ensure all reads from the cache get the latest value.
                this.pendingResponses.set(pendingResponseKey, Promise.resolve(cacheEntry));
            }
            if (!resolved) {
                resolved = true;
                resolver(cacheEntry);
            }
        };
        // we keep the previous cache entry around to leverage
        // when the incremental cache is disabled in minimal mode
        if (pendingResponseKey && this.minimalMode && ((ref = this.previousCacheItem) == null ? void 0 : ref.key) === pendingResponseKey && this.previousCacheItem.expiresAt > Date.now()) {
            resolve1(this.previousCacheItem.entry);
            this.pendingResponses.delete(pendingResponseKey);
            return promise;
        }
        (async ()=>{
            try {
                const cacheEntry = await responseGenerator(resolved, false);
                const resolveValue = cacheEntry === null ? null : {
                    ...cacheEntry,
                    isMiss: true
                };
                // for manual revalidate wait to resolve until cache is set
                if (!context.isManualRevalidate) {
                    resolve1(resolveValue);
                }
                if (key && cacheEntry && typeof cacheEntry.revalidate !== "undefined") {
                    this.previousCacheItem = {
                        key: pendingResponseKey || key,
                        entry: cacheEntry,
                        expiresAt: Date.now() + 1000
                    };
                } else {
                    this.previousCacheItem = undefined;
                }
                if (context.isManualRevalidate) {
                    resolve1(resolveValue);
                }
            } catch (err) {
                // while revalidating in the background we can't reject as
                // we already resolved the cache entry so log the error here
                if (resolved) {
                    console.error(err);
                } else {
                    rejecter(err);
                }
            } finally{
                if (pendingResponseKey) {
                    this.pendingResponses.delete(pendingResponseKey);
                }
            }
        })();
        return promise;
    }
}
exports.default = WebResponseCache;

//# sourceMappingURL=web.js.map