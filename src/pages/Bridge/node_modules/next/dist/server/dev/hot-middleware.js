"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _utils = require("../../build/utils");
var _nonNullable = require("../../lib/non-nullable");
function isMiddlewareStats(stats) {
    for (const key of stats.compilation.entrypoints.keys()){
        if ((0, _utils).isMiddlewareFilename(key)) {
            return true;
        }
    }
    return false;
}
function statsToJson(stats) {
    if (!stats) return {};
    return stats.toJson({
        all: false,
        errors: true,
        hash: true,
        warnings: true
    });
}
class EventStream {
    constructor(){
        this.clients = new Set();
    }
    everyClient(fn) {
        for (const client of this.clients){
            fn(client);
        }
    }
    close() {
        this.everyClient((client)=>{
            client.close();
        });
        this.clients.clear();
    }
    handler(client) {
        this.clients.add(client);
        client.addEventListener("close", ()=>{
            this.clients.delete(client);
        });
    }
    publish(payload) {
        this.everyClient((client)=>{
            client.send(JSON.stringify(payload));
        });
    }
}
class WebpackHotMiddleware {
    constructor(compilers){
        this.eventStream = new EventStream();
        this.clientLatestStats = null;
        this.middlewareLatestStats = null;
        this.serverLatestStats = null;
        this.closed = false;
        compilers[0].hooks.invalid.tap("webpack-hot-middleware", this.onClientInvalid);
        compilers[0].hooks.done.tap("webpack-hot-middleware", this.onClientDone);
        compilers[1].hooks.invalid.tap("webpack-hot-middleware", this.onServerInvalid);
        compilers[1].hooks.done.tap("webpack-hot-middleware", this.onServerDone);
        compilers[2].hooks.done.tap("webpack-hot-middleware", this.onEdgeServerDone);
        compilers[2].hooks.invalid.tap("webpack-hot-middleware", this.onEdgeServerInvalid);
    }
    onClientInvalid = ()=>{
        var ref;
        if (this.closed || ((ref = this.serverLatestStats) == null ? void 0 : ref.stats.hasErrors())) return;
        this.eventStream.publish({
            action: "building"
        });
    };
    onClientDone = (statsResult)=>{
        var ref;
        this.clientLatestStats = {
            ts: Date.now(),
            stats: statsResult
        };
        if (this.closed || ((ref = this.serverLatestStats) == null ? void 0 : ref.stats.hasErrors())) return;
        this.publishStats("built", statsResult);
    };
    onServerInvalid = ()=>{
        var ref, ref1;
        if (!((ref = this.serverLatestStats) == null ? void 0 : ref.stats.hasErrors())) return;
        this.serverLatestStats = null;
        if ((ref1 = this.clientLatestStats) == null ? void 0 : ref1.stats) {
            this.publishStats("built", this.clientLatestStats.stats);
        }
    };
    onServerDone = (statsResult)=>{
        if (this.closed) return;
        if (statsResult.hasErrors()) {
            this.serverLatestStats = {
                ts: Date.now(),
                stats: statsResult
            };
            this.publishStats("built", statsResult);
        }
    };
    onEdgeServerInvalid = ()=>{
        var ref, ref2;
        if (!((ref = this.middlewareLatestStats) == null ? void 0 : ref.stats.hasErrors())) return;
        this.middlewareLatestStats = null;
        if ((ref2 = this.clientLatestStats) == null ? void 0 : ref2.stats) {
            this.publishStats("built", this.clientLatestStats.stats);
        }
    };
    onEdgeServerDone = (statsResult)=>{
        if (!isMiddlewareStats(statsResult)) {
            this.onServerDone(statsResult);
            return;
        }
        if (statsResult.hasErrors()) {
            this.middlewareLatestStats = {
                ts: Date.now(),
                stats: statsResult
            };
            this.publishStats("built", statsResult);
        }
    };
    /**
   * To sync we use the most recent stats but also we append middleware
   * errors. This is because it is possible that middleware fails to compile
   * and we still want to show the client overlay with the error while
   * the error page should be rendered just fine.
   */ onHMR = (client)=>{
        if (this.closed) return;
        this.eventStream.handler(client);
        const [latestStats] = [
            this.clientLatestStats,
            this.serverLatestStats
        ].filter(_nonNullable.nonNullable).sort((statsA, statsB)=>statsB.ts - statsA.ts);
        if (latestStats == null ? void 0 : latestStats.stats) {
            var ref;
            const stats = statsToJson(latestStats.stats);
            const middlewareStats = statsToJson((ref = this.middlewareLatestStats) == null ? void 0 : ref.stats);
            this.eventStream.publish({
                action: "sync",
                hash: stats.hash,
                errors: [
                    ...stats.errors || [],
                    ...middlewareStats.errors || []
                ],
                warnings: [
                    ...stats.warnings || [],
                    ...middlewareStats.warnings || [], 
                ]
            });
        }
    };
    publishStats = (action, statsResult)=>{
        const stats = statsResult.toJson({
            all: false,
            hash: true,
            warnings: true,
            errors: true
        });
        this.eventStream.publish({
            action: action,
            hash: stats.hash,
            warnings: stats.warnings || [],
            errors: stats.errors || []
        });
    };
    publish = (payload)=>{
        if (this.closed) return;
        this.eventStream.publish(payload);
    };
    close = ()=>{
        if (this.closed) return;
        // Can't remove compiler plugins, so we just set a flag and noop if closed
        // https://github.com/webpack/tapable/issues/32#issuecomment-350644466
        this.closed = true;
        this.eventStream.close();
    };
}
exports.WebpackHotMiddleware = WebpackHotMiddleware;

//# sourceMappingURL=hot-middleware.js.map