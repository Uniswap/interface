"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.parseModule = void 0;
var _lruCache = _interopRequireDefault(require("next/dist/compiled/lru-cache"));
var _withPromiseCache = require("../../lib/with-promise-cache");
var _crypto = require("crypto");
var _swc = require("../swc");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const parseModule = (0, _withPromiseCache).withPromiseCache(new _lruCache.default({
    max: 500
}), async (filename, content)=>(0, _swc).parse(content, {
        isModule: "unknown",
        filename
    }).catch(()=>null), (_, content)=>(0, _crypto).createHash("sha1").update(content).digest("hex"));
exports.parseModule = parseModule;

//# sourceMappingURL=parse-module.js.map