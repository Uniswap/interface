"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = loadJsConfig;
var _path = _interopRequireDefault(require("path"));
var _fileExists = require("../lib/file-exists");
var Log = _interopRequireWildcard(require("./output/log"));
var _getTypeScriptConfiguration = require("../lib/typescript/getTypeScriptConfiguration");
var _fs = require("fs");
var _isError = _interopRequireDefault(require("../lib/is-error"));
var _hasNecessaryDependencies = require("../lib/has-necessary-dependencies");
async function loadJsConfig(dir, config) {
    let typeScriptPath;
    try {
        const deps = await (0, _hasNecessaryDependencies).hasNecessaryDependencies(dir, [
            {
                pkg: "typescript",
                file: "typescript/lib/typescript.js",
                exportsRestrict: true
            }, 
        ]);
        typeScriptPath = deps.resolved.get("typescript");
    } catch (_) {}
    const tsConfigPath = _path.default.join(dir, config.typescript.tsconfigPath);
    const useTypeScript = Boolean(typeScriptPath && await (0, _fileExists).fileExists(tsConfigPath));
    let implicitBaseurl;
    let jsConfig;
    // jsconfig is a subset of tsconfig
    if (useTypeScript) {
        if (config.typescript.tsconfigPath !== "tsconfig.json" && TSCONFIG_WARNED === false) {
            TSCONFIG_WARNED = true;
            Log.info(`Using tsconfig file: ${config.typescript.tsconfigPath}`);
        }
        const ts = await Promise.resolve(require(typeScriptPath));
        const tsConfig = await (0, _getTypeScriptConfiguration).getTypeScriptConfiguration(ts, tsConfigPath, true);
        jsConfig = {
            compilerOptions: tsConfig.options
        };
        implicitBaseurl = _path.default.dirname(tsConfigPath);
    }
    const jsConfigPath = _path.default.join(dir, "jsconfig.json");
    if (!useTypeScript && await (0, _fileExists).fileExists(jsConfigPath)) {
        jsConfig = parseJsonFile(jsConfigPath);
        implicitBaseurl = _path.default.dirname(jsConfigPath);
    }
    let resolvedBaseUrl;
    if (jsConfig) {
        var ref;
        if ((ref = jsConfig.compilerOptions) == null ? void 0 : ref.baseUrl) {
            resolvedBaseUrl = _path.default.resolve(dir, jsConfig.compilerOptions.baseUrl);
        } else {
            resolvedBaseUrl = implicitBaseurl;
        }
    }
    return {
        useTypeScript,
        jsConfig,
        resolvedBaseUrl
    };
}
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
let TSCONFIG_WARNED = false;
function parseJsonFile(filePath) {
    const JSON5 = require("next/dist/compiled/json5");
    const contents = (0, _fs).readFileSync(filePath, "utf8");
    // Special case an empty file
    if (contents.trim() === "") {
        return {};
    }
    try {
        return JSON5.parse(contents);
    } catch (err) {
        if (!(0, _isError).default(err)) throw err;
        const { codeFrameColumns  } = require("next/dist/compiled/babel/code-frame");
        const codeFrame = codeFrameColumns(String(contents), {
            start: {
                line: err.lineNumber || 0,
                column: err.columnNumber || 0
            }
        }, {
            message: err.message,
            highlightCode: true
        });
        throw new Error(`Failed to parse "${filePath}":\n${codeFrame}`);
    }
}

//# sourceMappingURL=load-jsconfig.js.map