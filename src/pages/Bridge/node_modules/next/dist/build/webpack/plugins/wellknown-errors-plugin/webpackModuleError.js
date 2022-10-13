"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getModuleBuildError = getModuleBuildError;
var _fs = require("fs");
var path = _interopRequireWildcard(require("path"));
var _parseBabel = require("./parseBabel");
var _parseCss = require("./parseCss");
var _parseScss = require("./parseScss");
var _parseNotFoundError = require("./parseNotFoundError");
var _isError = _interopRequireDefault(require("../../../../lib/is-error"));
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
function getFileData(compilation, m) {
    var ref;
    let resolved;
    var ref1;
    let ctx = (ref1 = (ref = compilation.compiler) == null ? void 0 : ref.context) != null ? ref1 : null;
    if (ctx !== null && typeof m.resource === "string") {
        const res = path.relative(ctx, m.resource).replace(/\\/g, path.posix.sep);
        resolved = res.startsWith(".") ? res : `.${path.posix.sep}${res}`;
    } else {
        const requestShortener = compilation.requestShortener;
        if (typeof (m == null ? void 0 : m.readableIdentifier) === "function") {
            resolved = m.readableIdentifier(requestShortener);
        } else {
            var _request;
            resolved = (_request = m.request) != null ? _request : m.userRequest;
        }
    }
    if (resolved) {
        let content = null;
        try {
            content = (0, _fs).readFileSync(ctx ? path.resolve(ctx, resolved) : resolved, "utf8");
        } catch  {}
        return [
            resolved,
            content
        ];
    }
    return [
        "<unknown>",
        null
    ];
}
async function getModuleBuildError(compilation, input) {
    if (!(typeof input === "object" && ((input == null ? void 0 : input.name) === "ModuleBuildError" || (input == null ? void 0 : input.name) === "ModuleNotFoundError") && Boolean(input.module) && (0, _isError).default(input.error))) {
        return false;
    }
    const err = input.error;
    const [sourceFilename, sourceContent] = getFileData(compilation, input.module);
    const notFoundError = await (0, _parseNotFoundError).getNotFoundError(compilation, input, sourceFilename);
    if (notFoundError !== false) {
        return notFoundError;
    }
    const babel = (0, _parseBabel).getBabelError(sourceFilename, err);
    if (babel !== false) {
        return babel;
    }
    const css = (0, _parseCss).getCssError(sourceFilename, err);
    if (css !== false) {
        return css;
    }
    const scss = (0, _parseScss).getScssError(sourceFilename, sourceContent, err);
    if (scss !== false) {
        return scss;
    }
    return false;
}

//# sourceMappingURL=webpackModuleError.js.map