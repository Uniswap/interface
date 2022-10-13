"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.LoadableContext = void 0;
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _react = _interop_require_default(require("react"));
const LoadableContext = _react.default.createContext(null);
exports.LoadableContext = LoadableContext;
if (process.env.NODE_ENV !== 'production') {
    LoadableContext.displayName = 'LoadableContext';
}

//# sourceMappingURL=loadable-context.js.map