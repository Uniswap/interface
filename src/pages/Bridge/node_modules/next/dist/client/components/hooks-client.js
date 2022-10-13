"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FlushEffectsContext", {
    enumerable: true,
    get: function() {
        return _flushEffects.FlushEffectsContext;
    }
});
Object.defineProperty(exports, "useFlushEffects", {
    enumerable: true,
    get: function() {
        return _flushEffects.useFlushEffects;
    }
});
exports.useSearchParams = useSearchParams;
exports.useSearchParam = useSearchParam;
exports.useRouter = useRouter;
exports.usePathname = usePathname;
exports.useSelectedLayoutSegment = useSelectedLayoutSegment;
var _react = require("react");
var _hooksClientContext = require("./hooks-client-context");
var _appRouterContext = require("../../shared/lib/app-router-context");
var _flushEffects = require("../../shared/lib/flush-effects");
function useSearchParams() {
    return (0, _react).useContext(_hooksClientContext.SearchParamsContext);
}
function useSearchParam(key) {
    const params = (0, _react).useContext(_hooksClientContext.SearchParamsContext);
    return params[key];
}
function useRouter() {
    return (0, _react).useContext(_appRouterContext.AppRouterContext);
}
function usePathname() {
    return (0, _react).useContext(_hooksClientContext.PathnameContext);
}
function useSelectedLayoutSegment(parallelRouteKey = 'children') {
    const { tree  } = (0, _react).useContext(_appRouterContext.LayoutRouterContext);
    const segment = tree[1][parallelRouteKey][0];
    return Array.isArray(segment) ? segment[1] : segment;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=hooks-client.js.map