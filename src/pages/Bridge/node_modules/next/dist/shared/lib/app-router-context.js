"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TemplateContext = exports.GlobalLayoutRouterContext = exports.LayoutRouterContext = exports.AppRouterContext = void 0;
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _react = _interop_require_default(require("react"));
const AppRouterContext = _react.default.createContext(null);
exports.AppRouterContext = AppRouterContext;
const LayoutRouterContext = _react.default.createContext(null);
exports.LayoutRouterContext = LayoutRouterContext;
const GlobalLayoutRouterContext = _react.default.createContext(null);
exports.GlobalLayoutRouterContext = GlobalLayoutRouterContext;
const TemplateContext = _react.default.createContext(null);
exports.TemplateContext = TemplateContext;
if (process.env.NODE_ENV !== 'production') {
    AppRouterContext.displayName = 'AppRouterContext';
    LayoutRouterContext.displayName = 'LayoutRouterContext';
    GlobalLayoutRouterContext.displayName = 'GlobalLayoutRouterContext';
    TemplateContext.displayName = 'TemplateContext';
}

//# sourceMappingURL=app-router-context.js.map