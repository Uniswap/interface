"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.addLocale = void 0;
var _normalizeTrailingSlash = require("./normalize-trailing-slash");
const addLocale = (path, ...args)=>{
    if (process.env.__NEXT_I18N_SUPPORT) {
        return (0, _normalizeTrailingSlash).normalizePathTrailingSlash(require('../shared/lib/router/utils/add-locale').addLocale(path, ...args));
    }
    return path;
};
exports.addLocale = addLocale;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=add-locale.js.map