"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setConfig = setConfig;
exports.default = void 0;
let runtimeConfig;
var _default = ()=>{
    return runtimeConfig;
};
exports.default = _default;
function setConfig(configValue) {
    runtimeConfig = configValue;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=runtime-config.js.map