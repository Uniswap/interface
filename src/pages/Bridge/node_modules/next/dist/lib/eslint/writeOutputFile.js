"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.writeOutputFile = writeOutputFile;
var _fs = require("fs");
var _path = _interopRequireDefault(require("path"));
var Log = _interopRequireWildcard(require("../../build/output/log"));
var _isError = _interopRequireDefault(require("../../lib/is-error"));
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
/**
 * Check if a given file path is a directory or not.
 * @param {string} filePath The path to a file to check.
 * @returns {Promise<boolean>} `true` if the path is a directory.
 */ async function isDirectory(filePath) {
    try {
        return (await _fs.promises.stat(filePath)).isDirectory();
    } catch (error) {
        if ((0, _isError).default(error) && (error.code === "ENOENT" || error.code === "ENOTDIR")) {
            return false;
        }
        throw error;
    }
}
async function writeOutputFile(outputFile, outputData) {
    const filePath = _path.default.resolve(process.cwd(), outputFile);
    if (await isDirectory(filePath)) {
        Log.error(`Cannot write to output file path, it is a directory: ${filePath}`);
    } else {
        try {
            await _fs.promises.mkdir(_path.default.dirname(filePath), {
                recursive: true
            });
            await _fs.promises.writeFile(filePath, outputData);
            Log.info(`The output file has been created: ${filePath}`);
        } catch (err) {
            Log.error(`There was a problem writing the output file: ${filePath}`);
            console.error(err);
        }
    }
}

//# sourceMappingURL=writeOutputFile.js.map