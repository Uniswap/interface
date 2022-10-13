"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.useFlushEffects = useFlushEffects;
exports.FlushEffectsContext = void 0;
var _interop_require_wildcard = require("@swc/helpers/lib/_interop_require_wildcard.js").default;
var _react = _interop_require_wildcard(require("react"));
const FlushEffectsContext = /*#__PURE__*/ _react.default.createContext(null);
exports.FlushEffectsContext = FlushEffectsContext;
function useFlushEffects(callback) {
    const addFlushEffects = (0, _react).useContext(FlushEffectsContext);
    // Should have no effects on client where there's no flush effects provider
    if (addFlushEffects) {
        addFlushEffects(callback);
    }
}

//# sourceMappingURL=flush-effects.js.map