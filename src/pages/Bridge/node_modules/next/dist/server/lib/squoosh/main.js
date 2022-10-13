"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getMetadata = getMetadata;
exports.processBuffer = processBuffer;
exports.decodeBuffer = decodeBuffer;
var _jestWorker = require("next/dist/compiled/jest-worker");
var path = _interopRequireWildcard(require("path"));
var _utils = require("../../../shared/lib/utils");
var _os = require("os");
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
const getWorker = (0, _utils).execOnce(()=>new _jestWorker.Worker(path.resolve(__dirname, "impl"), {
        enableWorkerThreads: true,
        // There will be at most 6 workers needed since each worker will take
        // at least 1 operation type.
        numWorkers: Math.max(1, Math.min((0, _os).cpus().length - 1, 6)),
        computeWorkerKey: (method)=>method
    }));
async function getMetadata(buffer) {
    const worker = getWorker();
    const { width , height  } = await worker.decodeBuffer(buffer);
    return {
        width,
        height
    };
}
async function processBuffer(buffer, operations, encoding, quality) {
    const worker = getWorker();
    let imageData = await worker.decodeBuffer(buffer);
    for (const operation of operations){
        if (operation.type === "rotate") {
            imageData = await worker.rotate(imageData, operation.numRotations);
        } else if (operation.type === "resize") {
            const opt = {
                image: imageData,
                width: 0,
                height: 0
            };
            if (operation.width && imageData.width && imageData.width > operation.width) {
                opt.width = operation.width;
            }
            if (operation.height && imageData.height && imageData.height > operation.height) {
                opt.height = operation.height;
            }
            if (opt.width > 0 || opt.height > 0) {
                imageData = await worker.resize(opt);
            }
        }
    }
    switch(encoding){
        case "jpeg":
            return Buffer.from(await worker.encodeJpeg(imageData, {
                quality
            }));
        case "webp":
            return Buffer.from(await worker.encodeWebp(imageData, {
                quality
            }));
        case "avif":
            const avifQuality = quality - 20;
            return Buffer.from(await worker.encodeAvif(imageData, {
                quality: Math.max(avifQuality, 0)
            }));
        case "png":
            return Buffer.from(await worker.encodePng(imageData));
        default:
            throw Error(`Unsupported encoding format`);
    }
}
async function decodeBuffer(buffer) {
    const worker = getWorker();
    const imageData = await worker.decodeBuffer(buffer);
    return imageData;
}

//# sourceMappingURL=main.js.map