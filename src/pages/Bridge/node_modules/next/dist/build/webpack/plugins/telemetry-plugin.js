"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _webpack = require("next/dist/compiled/webpack/webpack");
// Map of a feature module to the file it belongs in the next package.
const FEATURE_MODULE_MAP = new Map([
    [
        "next/image",
        "/next/image.js"
    ],
    [
        "next/future/image",
        "/next/future/image.js"
    ],
    [
        "next/script",
        "/next/script.js"
    ],
    [
        "next/dynamic",
        "/next/dynamic.js"
    ], 
]);
// List of build features used in webpack configuration
const BUILD_FEATURES = [
    "swcLoader",
    "swcMinify",
    "swcRelay",
    "swcStyledComponents",
    "swcReactRemoveProperties",
    "swcExperimentalDecorators",
    "swcRemoveConsole",
    "swcImportSource",
    "swcEmotion",
    "swc/target/x86_64-apple-darwin",
    "swc/target/x86_64-unknown-linux-gnu",
    "swc/target/x86_64-pc-windows-msvc",
    "swc/target/i686-pc-windows-msvc",
    "swc/target/aarch64-unknown-linux-gnu",
    "swc/target/armv7-unknown-linux-gnueabihf",
    "swc/target/aarch64-apple-darwin",
    "swc/target/aarch64-linux-android",
    "swc/target/arm-linux-androideabi",
    "swc/target/x86_64-unknown-freebsd",
    "swc/target/x86_64-unknown-linux-musl",
    "swc/target/aarch64-unknown-linux-musl",
    "swc/target/aarch64-pc-windows-msvc", 
];
const ELIMINATED_PACKAGES = new Set();
/**
 * Determine if there is a feature of interest in the specified 'module'.
 */ function findFeatureInModule(module) {
    if (module.type !== "javascript/auto") {
        return;
    }
    for (const [feature, path] of FEATURE_MODULE_MAP){
        if (module.identifier().replace(/\\/g, "/").endsWith(path)) {
            return feature;
        }
    }
}
/**
 * Find unique origin modules in the specified 'connections', which possibly
 * contains more than one connection for a module due to different types of
 * dependency.
 */ function findUniqueOriginModulesInConnections(connections) {
    const originModules = new Set();
    for (const connection of connections){
        if (!originModules.has(connection.originModule)) {
            originModules.add(connection.originModule);
        }
    }
    return originModules;
}
class TelemetryPlugin {
    usageTracker = new Map();
    // Build feature usage is on/off and is known before the build starts
    constructor(buildFeaturesMap){
        for (const featureName of BUILD_FEATURES){
            this.usageTracker.set(featureName, {
                featureName,
                invocationCount: buildFeaturesMap.get(featureName) ? 1 : 0
            });
        }
        for (const featureName1 of FEATURE_MODULE_MAP.keys()){
            this.usageTracker.set(featureName1, {
                featureName: featureName1,
                invocationCount: 0
            });
        }
    }
    apply(compiler) {
        compiler.hooks.make.tapAsync(TelemetryPlugin.name, async (compilation, callback)=>{
            compilation.hooks.finishModules.tapAsync(TelemetryPlugin.name, async (modules, modulesFinish)=>{
                for (const module of modules){
                    const feature = findFeatureInModule(module);
                    if (!feature) {
                        continue;
                    }
                    const connections = compilation.moduleGraph.getIncomingConnections(module);
                    const originModules = findUniqueOriginModulesInConnections(connections);
                    this.usageTracker.get(feature).invocationCount = originModules.size;
                }
                modulesFinish();
            });
            callback();
        });
        if (compiler.options.mode === "production" && !compiler.watchMode) {
            compiler.hooks.compilation.tap(TelemetryPlugin.name, (compilation)=>{
                const moduleHooks = _webpack.NormalModule.getCompilationHooks(compilation);
                moduleHooks.loader.tap(TelemetryPlugin.name, (loaderContext)=>{
                    loaderContext.eliminatedPackages = ELIMINATED_PACKAGES;
                });
            });
        }
    }
    usages() {
        return [
            ...this.usageTracker.values()
        ];
    }
    packagesUsedInServerSideProps() {
        return Array.from(ELIMINATED_PACKAGES);
    }
}
exports.TelemetryPlugin = TelemetryPlugin;

//# sourceMappingURL=telemetry-plugin.js.map