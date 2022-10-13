"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _webpack = require("next/dist/compiled/webpack/webpack");
var _crypto = _interopRequireDefault(require("crypto"));
var _constants = require("../../../shared/lib/constants");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const PLUGIN_NAME = "SubresourceIntegrityPlugin";
class SubresourceIntegrityPlugin {
    constructor(algorithm){
        this.algorithm = algorithm;
    }
    apply(compiler) {
        compiler.hooks.make.tap(PLUGIN_NAME, (compilation)=>{
            compilation.hooks.afterOptimizeAssets.tap({
                name: PLUGIN_NAME,
                stage: _webpack.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            }, (assets)=>{
                // Collect all the entrypoint files.
                let files = new Set();
                for (const entrypoint of compilation.entrypoints.values()){
                    const iterator = entrypoint == null ? void 0 : entrypoint.getFiles();
                    if (!iterator) {
                        continue;
                    }
                    for (const file of iterator){
                        files.add(file);
                    }
                }
                // For each file, deduped, calculate the file hash.
                const hashes = {};
                for (const file of files.values()){
                    // Get the buffer for the asset.
                    const asset = assets[file];
                    if (!asset) {
                        throw new Error(`could not get asset: ${file}`);
                    }
                    // Get the buffer for the asset.
                    const buffer = asset.buffer();
                    // Create the hash for the content.
                    const hash = _crypto.default.createHash(this.algorithm).update(buffer).digest().toString("base64");
                    hashes[file] = `${this.algorithm}-${hash}`;
                }
                const json = JSON.stringify(hashes, null, 2);
                const file1 = "server/" + _constants.SUBRESOURCE_INTEGRITY_MANIFEST;
                assets[file1 + ".js"] = new _webpack.sources.RawSource("self.__SUBRESOURCE_INTEGRITY_MANIFEST=" + json);
                assets[file1 + ".json"] = new _webpack.sources.RawSource(json);
            });
        });
    }
}
exports.SubresourceIntegrityPlugin = SubresourceIntegrityPlugin;

//# sourceMappingURL=subresource-integrity-plugin.js.map