"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _webpack = require("next/dist/compiled/webpack/webpack");
var _constants = require("../../../shared/lib/constants");
var _path = require("path");
var _utils = require("../loaders/utils");
const PLUGIN_NAME = "FlightManifestPlugin";
class FlightManifestPlugin {
    dev = false;
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
                // Have to be in the optimize stage to run after updating the CSS
                // asset hash via extract mini css plugin.
                stage: _webpack.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_HASH
            }, (assets)=>this.createAsset(assets, compilation, compiler.context));
        });
    }
    createAsset(assets, compilation, context) {
        const manifest = {
            __ssr_module_mapping__: {}
        };
        const dev = this.dev;
        const clientRequestsSet = new Set();
        // Collect client requests
        function collectClientRequest(mod) {
            if (mod.resource === "" && mod.buildInfo.rsc) {
                const { requests =[]  } = mod.buildInfo.rsc;
                requests.forEach((r)=>{
                    clientRequestsSet.add(require.resolve(r));
                });
            }
        }
        compilation.chunkGroups.forEach((chunkGroup)=>{
            chunkGroup.chunks.forEach((chunk)=>{
                const chunkModules = compilation.chunkGraph.getChunkModulesIterable(chunk);
                for (const mod of chunkModules){
                    collectClientRequest(mod);
                    const anyModule = mod;
                    if (anyModule.modules) {
                        for (const subMod of anyModule.modules)collectClientRequest(subMod);
                    }
                }
            });
        });
        compilation.chunkGroups.forEach((chunkGroup)=>{
            const cssResourcesInChunkGroup = new Set();
            let entryFilepath = "";
            function recordModule(chunk, id, mod) {
                var ref2, ref1;
                const isCSSModule = ((ref2 = mod.resource) == null ? void 0 : ref2.endsWith(".css")) || mod.type === "css/mini-extract" || !!mod.loaders && (dev ? mod.loaders.some((item)=>item.loader.includes("next-style-loader/index.js")) : mod.loaders.some((item)=>item.loader.includes("mini-css-extract-plugin/loader.js")));
                const resource = mod.type === "css/mini-extract" ? mod._identifier.slice(mod._identifier.lastIndexOf("!") + 1) : mod.resource;
                if (!resource) {
                    return;
                }
                const moduleExports = manifest[resource] || {};
                const moduleIdMapping = manifest.__ssr_module_mapping__;
                // Note that this isn't that reliable as webpack is still possible to assign
                // additional queries to make sure there's no conflict even using the `named`
                // module ID strategy.
                let ssrNamedModuleId = (0, _path).relative(context, ((ref1 = mod.resourceResolveData) == null ? void 0 : ref1.path) || resource);
                if (!ssrNamedModuleId.startsWith(".")) // TODO use getModuleId instead
                ssrNamedModuleId = `./${ssrNamedModuleId.replace(/\\/g, "/")}`;
                if (isCSSModule) {
                    if (!manifest[resource]) {
                        const chunks = [
                            ...chunk.files
                        ].filter((f)=>f.endsWith(".css"));
                        manifest[resource] = {
                            default: {
                                id,
                                name: "default",
                                chunks
                            }
                        };
                    }
                    if (chunkGroup.name) {
                        cssResourcesInChunkGroup.add(resource);
                    }
                    return;
                }
                // Only apply following logic to client module requests from client entry,
                // or if the module is marked as client module.
                if (!clientRequestsSet.has(resource) && !(0, _utils).isClientComponentModule(mod)) {
                    return;
                }
                if (/[\\/](page|layout)\.(ts|js)x?$/.test(resource)) {
                    entryFilepath = resource;
                }
                const exportsInfo = compilation.moduleGraph.getExportsInfo(mod);
                const cjsExports = [
                    ...new Set([
                        ...mod.dependencies.map((dep)=>{
                            // Match CommonJsSelfReferenceDependency
                            if (dep.type === "cjs self exports reference") {
                                // @ts-expect-error: TODO: Fix Dependency type
                                if (dep.base === "module.exports") {
                                    return "default";
                                }
                                // `exports.foo = ...`, `exports.default = ...`
                                // @ts-expect-error: TODO: Fix Dependency type
                                if (dep.base === "exports") {
                                    // @ts-expect-error: TODO: Fix Dependency type
                                    return dep.names.filter((name)=>name !== "__esModule");
                                }
                            }
                            return null;
                        }), 
                    ]), 
                ];
                function getAppPathRequiredChunks() {
                    return chunkGroup.chunks.map((requiredChunk)=>{
                        return requiredChunk.id + ":" + (requiredChunk.name || requiredChunk.id) + (dev ? "" : "-" + requiredChunk.hash);
                    });
                }
                const moduleExportedKeys = [
                    "",
                    "*"
                ].concat([
                    ...exportsInfo.exports
                ].filter((exportInfo)=>exportInfo.provided).map((exportInfo)=>exportInfo.name), ...cjsExports).filter((name)=>name !== null);
                moduleExportedKeys.forEach((name)=>{
                    var ref;
                    // If the chunk is from `app/` chunkGroup, use it first.
                    // This make sure not to load the overlapped chunk from `pages/` chunkGroup
                    if (!moduleExports[name] || ((ref = chunkGroup.name) == null ? void 0 : ref.startsWith("app/"))) {
                        const requiredChunks = getAppPathRequiredChunks();
                        moduleExports[name] = {
                            id,
                            name,
                            chunks: requiredChunks
                        };
                    }
                    moduleIdMapping[id] = moduleIdMapping[id] || {};
                    moduleIdMapping[id][name] = {
                        ...moduleExports[name],
                        id: ssrNamedModuleId
                    };
                });
                manifest[resource] = moduleExports;
                manifest.__ssr_module_mapping__ = moduleIdMapping;
            }
            chunkGroup.chunks.forEach((chunk)=>{
                const chunkModules = compilation.chunkGraph.getChunkModulesIterable(chunk);
                for (const mod of chunkModules){
                    const modId = compilation.chunkGraph.getModuleId(mod);
                    recordModule(chunk, modId, mod);
                    // If this is a concatenation, register each child to the parent ID.
                    // TODO: remove any
                    const anyModule = mod;
                    if (anyModule.modules) {
                        anyModule.modules.forEach((concatenatedMod)=>{
                            recordModule(chunk, modId, concatenatedMod);
                        });
                    }
                }
            });
            const clientCSSManifest = manifest.__client_css_manifest__ || {};
            if (entryFilepath) {
                clientCSSManifest[entryFilepath] = Array.from(cssResourcesInChunkGroup);
            }
            manifest.__client_css_manifest__ = clientCSSManifest;
        });
        const file = "server/" + _constants.FLIGHT_MANIFEST;
        const json = JSON.stringify(manifest);
        assets[file + ".js"] = new _webpack.sources.RawSource("self.__RSC_MANIFEST=" + json);
        assets[file + ".json"] = new _webpack.sources.RawSource(json);
    }
}
exports.FlightManifestPlugin = FlightManifestPlugin;

//# sourceMappingURL=flight-manifest-plugin.js.map