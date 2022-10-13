"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _webpack = require("next/dist/compiled/webpack/webpack");
var _constants = require("../../../shared/lib/constants");
var _buildManifestPlugin = require("./build-manifest-plugin");
var _getAppRouteFromEntrypoint = _interopRequireDefault(require("../../../server/get-app-route-from-entrypoint"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const PLUGIN_NAME = "AppBuildManifestPlugin";
class AppBuildManifestPlugin {
    constructor(options){
        this.dev = options.dev;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory  })=>{
            compilation.dependencyFactories.set(_webpack.webpack.dependencies.ModuleDependency, normalModuleFactory);
            compilation.dependencyTemplates.set(_webpack.webpack.dependencies.ModuleDependency, new _webpack.webpack.dependencies.NullDependency.Template());
        });
        compiler.hooks.make.tap(PLUGIN_NAME, (compilation)=>{
            compilation.hooks.processAssets.tap({
                name: PLUGIN_NAME,
                // @ts-ignore TODO: Remove ignore when webpack 5 is stable
                stage: _webpack.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            }, (assets)=>this.createAsset(assets, compilation));
        });
    }
    createAsset(assets, compilation) {
        const manifest = {
            pages: {}
        };
        const systemEntrypoints = new Set([
            _constants.CLIENT_STATIC_FILES_RUNTIME_MAIN,
            _constants.CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH,
            _constants.CLIENT_STATIC_FILES_RUNTIME_AMP,
            _constants.CLIENT_STATIC_FILES_RUNTIME_MAIN_APP, 
        ]);
        const mainFiles = new Set((0, _buildManifestPlugin).getEntrypointFiles(compilation.entrypoints.get(_constants.CLIENT_STATIC_FILES_RUNTIME_MAIN_APP)));
        for (const entrypoint of compilation.entrypoints.values()){
            if (!entrypoint.name) {
                continue;
            }
            if (systemEntrypoints.has(entrypoint.name)) {
                continue;
            }
            const pagePath = (0, _getAppRouteFromEntrypoint).default(entrypoint.name);
            if (!pagePath) {
                continue;
            }
            const filesForPage = (0, _buildManifestPlugin).getEntrypointFiles(entrypoint);
            manifest.pages[pagePath] = [
                ...new Set([
                    ...mainFiles,
                    ...filesForPage
                ])
            ];
        }
        const json = JSON.stringify(manifest, null, 2);
        assets[_constants.APP_BUILD_MANIFEST] = new _webpack.sources.RawSource(json);
    }
}
exports.AppBuildManifestPlugin = AppBuildManifestPlugin;

//# sourceMappingURL=app-build-manifest-plugin.js.map