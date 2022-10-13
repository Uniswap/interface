"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.downloadWasmSwc = downloadWasmSwc;
var _os = _interopRequireDefault(require("os"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var Log = _interopRequireWildcard(require("../build/output/log"));
var _childProcess = require("child_process");
var _tar = _interopRequireDefault(require("next/dist/compiled/tar"));
var _nodeFetch = _interopRequireDefault(require("next/dist/compiled/node-fetch"));
var _fileExists = require("./file-exists");
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
const MAX_VERSIONS_TO_CACHE = 5;
async function downloadWasmSwc(version, wasmDirectory, variant = "nodejs") {
    const pkgName = `@next/swc-wasm-${variant}`;
    const tarFileName = `${pkgName.substring(6)}-${version}.tgz`;
    const outputDirectory = _path.default.join(wasmDirectory, pkgName);
    if (await (0, _fileExists).fileExists(outputDirectory)) {
        // if the package is already downloaded a different
        // failure occurred than not being present
        return;
    }
    // get platform specific cache directory adapted from playwright's handling
    // https://github.com/microsoft/playwright/blob/7d924470d397975a74a19184c136b3573a974e13/packages/playwright-core/src/utils/registry.ts#L141
    const cacheDirectory = await (async ()=>{
        let result;
        const envDefined = process.env["NEXT_SWC_PATH"];
        if (envDefined) {
            result = envDefined;
        } else {
            let systemCacheDirectory;
            if (process.platform === "linux") {
                systemCacheDirectory = process.env.XDG_CACHE_HOME || _path.default.join(_os.default.homedir(), ".cache");
            } else if (process.platform === "darwin") {
                systemCacheDirectory = _path.default.join(_os.default.homedir(), "Library", "Caches");
            } else if (process.platform === "win32") {
                systemCacheDirectory = process.env.LOCALAPPDATA || _path.default.join(_os.default.homedir(), "AppData", "Local");
            } else {
                /// Attempt to use generic tmp location for these platforms
                if (process.platform === "freebsd" || process.platform === "android") {
                    for (const dir of [
                        _path.default.join(_os.default.homedir(), ".cache"),
                        _path.default.join(_os.default.tmpdir()), 
                    ]){
                        if (await (0, _fileExists).fileExists(dir)) {
                            systemCacheDirectory = dir;
                            break;
                        }
                    }
                }
                if (!systemCacheDirectory) {
                    console.error(new Error("Unsupported platform: " + process.platform));
                    process.exit(0);
                }
            }
            result = _path.default.join(systemCacheDirectory, "next-swc");
        }
        if (!_path.default.isAbsolute(result)) {
            // It is important to resolve to the absolute path:
            //   - for unzipping to work correctly;
            //   - so that registry directory matches between installation and execution.
            // INIT_CWD points to the root of `npm/yarn install` and is probably what
            // the user meant when typing the relative path.
            result = _path.default.resolve(process.env["INIT_CWD"] || process.cwd(), result);
        }
        return result;
    })();
    await _fs.default.promises.mkdir(outputDirectory, {
        recursive: true
    });
    const extractFromTar = async ()=>{
        await _tar.default.x({
            file: _path.default.join(cacheDirectory, tarFileName),
            cwd: outputDirectory,
            strip: 1
        });
    };
    if (!await (0, _fileExists).fileExists(_path.default.join(cacheDirectory, tarFileName))) {
        Log.info("Downloading WASM swc package...");
        await _fs.default.promises.mkdir(cacheDirectory, {
            recursive: true
        });
        const tempFile = _path.default.join(cacheDirectory, `${tarFileName}.temp-${Date.now()}`);
        let registry = `https://registry.npmjs.org/`;
        try {
            const output = (0, _childProcess).execSync("npm config get registry").toString().trim();
            if (output.startsWith("http")) {
                registry = output.endsWith("/") ? output : `${output}/`;
            }
        } catch (_) {}
        await (0, _nodeFetch).default(`${registry}${pkgName}/-/${tarFileName}`).then((res)=>{
            if (!res.ok) {
                throw new Error(`request failed with status ${res.status}`);
            }
            const cacheWriteStream = _fs.default.createWriteStream(tempFile);
            return new Promise((resolve, reject)=>{
                res.body.pipe(cacheWriteStream).on("error", (err)=>reject(err)).on("finish", ()=>resolve());
            }).finally(()=>cacheWriteStream.close());
        });
        await _fs.default.promises.rename(tempFile, _path.default.join(cacheDirectory, tarFileName));
    }
    await extractFromTar();
    const cacheFiles = await _fs.default.promises.readdir(cacheDirectory);
    if (cacheFiles.length > MAX_VERSIONS_TO_CACHE) {
        cacheFiles.sort((a, b)=>{
            if (a.length < b.length) return -1;
            return a.localeCompare(b);
        });
        // prune oldest versions in cache
        for(let i = 0; i++; i < cacheFiles.length - MAX_VERSIONS_TO_CACHE){
            await _fs.default.promises.unlink(_path.default.join(cacheDirectory, cacheFiles[i])).catch(()=>{});
        }
    }
}

//# sourceMappingURL=download-wasm-swc.js.map