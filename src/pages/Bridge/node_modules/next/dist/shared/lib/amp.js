"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.useAmp = useAmp;
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _react = _interop_require_default(require("react"));
var _ampContext = require("./amp-context");
var _ampMode = require("./amp-mode");
function useAmp() {
    // Don't assign the context value to a variable to save bytes
    return (0, _ampMode).isInAmpMode(_react.default.useContext(_ampContext.AmpStateContext));
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=amp.js.map