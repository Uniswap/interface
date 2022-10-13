"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _sandbox = require("../../../server/web/sandbox");
var _fs = require("fs");
var _path = _interopRequireDefault(require("path"));
var _isError = _interopRequireDefault(require("../../../lib/is-error"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const originModules = [
    require.resolve("../../../server/require"),
    require.resolve("../../../server/load-components"), 
];
const RUNTIME_NAMES = [
    "webpack-runtime",
    "webpack-api-runtime"
];
function deleteCache(filePath) {
    try {
        filePath = (0, _fs).realpathSync(filePath);
    } catch (e) {
        if ((0, _isError).default(e) && e.code !== "ENOENT") throw e;
    }
    const mod = require.cache[filePath];
    if (mod) {
        // remove the child reference from the originModules
        for (const originModule of originModules){
            const parent = require.cache[originModule];
            if (parent) {
                const idx = parent.children.indexOf(mod);
                if (idx >= 0) parent.children.splice(idx, 1);
            }
        }
        // remove parent references from external modules
        for (const child of mod.children){
            child.parent = null;
        }
        delete require.cache[filePath];
        return true;
    }
    return false;
}
const PLUGIN_NAME = "NextJsRequireCacheHotReloader";
class NextJsRequireCacheHotReloader {
    prevAssets = null;
    constructor(opts){
        this.hasServerComponents = opts.hasServerComponents;
    }
    apply(compiler) {
        compiler.hooks.assetEmitted.tap(PLUGIN_NAME, (_file, { targetPath , content  })=>{
            deleteCache(targetPath);
            (0, _sandbox).clearModuleContext(targetPath, content.toString("utf-8"));
        });
        compiler.hooks.afterEmit.tap(PLUGIN_NAME, (compilation)=>{
            RUNTIME_NAMES.forEach((name)=>{
                const runtimeChunkPath = _path.default.join(compilation.outputOptions.path, `${name}.js`);
                deleteCache(runtimeChunkPath);
            });
            // we need to make sure to clear all server entries from cache
            // since they can have a stale webpack-runtime cache
            // which needs to always be in-sync
            const entries = [
                ...compilation.entries.keys()
            ].filter((entry)=>entry.toString().startsWith("pages/") || entry.toString().startsWith("app/"));
            entries.forEach((page)=>{
                const outputPath = _path.default.join(compilation.outputOptions.path, page + ".js");
                deleteCache(outputPath);
            });
        });
    }
}
exports.NextJsRequireCacheHotReloader = NextJsRequireCacheHotReloader;

//# sourceMappingURL=nextjs-require-cache-hot-reloader.js.map