"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _webpack = require("next/dist/compiled/webpack/webpack");
var _constants = require("../../../shared/lib/constants");
var _getRouteFromEntrypoint = _interopRequireDefault(require("../../../server/get-route-from-entrypoint"));
var _normalizePathSep = require("../../../shared/lib/page-path/normalize-path-sep");
class PagesManifestPlugin {
    constructor({ serverless , dev , isEdgeRuntime , appDirEnabled  }){
        this.serverless = serverless;
        this.dev = dev;
        this.isEdgeRuntime = isEdgeRuntime;
        this.appDirEnabled = appDirEnabled;
    }
    createAssets(compilation, assets) {
        const entrypoints = compilation.entrypoints;
        const pages = {};
        const appPaths = {};
        for (const entrypoint of entrypoints.values()){
            const pagePath = (0, _getRouteFromEntrypoint).default(entrypoint.name, this.appDirEnabled);
            if (!pagePath) {
                continue;
            }
            const files = entrypoint.getFiles().filter((file)=>!file.includes("webpack-runtime") && !file.includes("webpack-api-runtime") && file.endsWith(".js"));
            // Skip entries which are empty
            if (!files.length) {
                continue;
            }
            // Write filename, replace any backslashes in path (on windows) with forwardslashes for cross-platform consistency.
            let file1 = files[files.length - 1];
            if (!this.dev) {
                if (!this.isEdgeRuntime) {
                    file1 = file1.slice(3);
                }
            }
            file1 = (0, _normalizePathSep).normalizePathSep(file1);
            if (entrypoint.name.startsWith("app/")) {
                appPaths[pagePath] = file1;
            } else {
                pages[pagePath] = file1;
            }
        }
        // This plugin is used by both the Node server and Edge server compilers,
        // we need to merge both pages to generate the full manifest.
        if (this.isEdgeRuntime) {
            edgeServerPages = pages;
            edgeServerAppPaths = appPaths;
        } else {
            nodeServerPages = pages;
            nodeServerAppPaths = appPaths;
        }
        assets[`${!this.dev && !this.isEdgeRuntime ? "../" : ""}` + _constants.PAGES_MANIFEST] = new _webpack.sources.RawSource(JSON.stringify({
            ...edgeServerPages,
            ...nodeServerPages
        }, null, 2));
        if (this.appDirEnabled) {
            assets[`${!this.dev && !this.isEdgeRuntime ? "../" : ""}` + _constants.APP_PATHS_MANIFEST] = new _webpack.sources.RawSource(JSON.stringify({
                ...edgeServerAppPaths,
                ...nodeServerAppPaths
            }, null, 2));
        }
    }
    apply(compiler) {
        compiler.hooks.make.tap("NextJsPagesManifest", (compilation)=>{
            // @ts-ignore TODO: Remove ignore when webpack 5 is stable
            compilation.hooks.processAssets.tap({
                name: "NextJsPagesManifest",
                // @ts-ignore TODO: Remove ignore when webpack 5 is stable
                stage: _webpack.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            }, (assets)=>{
                this.createAssets(compilation, assets);
            });
        });
    }
}
exports.default = PagesManifestPlugin;
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
let edgeServerPages = {};
let nodeServerPages = {};
let edgeServerAppPaths = {};
let nodeServerAppPaths = {};

//# sourceMappingURL=pages-manifest-plugin.js.map