"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = dynamic;
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _react = _interop_require_default(require("react"));
function dynamic(loader) {
    const LazyLoadable = /*#__PURE__*/ _react.default.lazy(loader);
    return LazyLoadable;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=index.js.map