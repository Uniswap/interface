"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StaticGenerationContext = exports.CookiesContext = exports.PreviewDataContext = exports.HeadersContext = exports.CONTEXT_NAMES = void 0;
var _react = require("react");
class DynamicServerError extends Error {
    constructor(type){
        super(`Dynamic server usage: ${type}`);
    }
}
exports.DynamicServerError = DynamicServerError;
// Ensure serverContext is not created more than once as React will throw when creating it more than once
// https://github.com/facebook/react/blob/dd2d6522754f52c70d02c51db25eb7cbd5d1c8eb/packages/react/src/ReactServerContext.js#L101
const createContext = (name, defaultValue = null)=>{
    // @ts-expect-error __NEXT_DEV_SERVER_CONTEXT__ is a global
    if (!global.__NEXT_DEV_SERVER_CONTEXT__) {
        // @ts-expect-error __NEXT_DEV_SERVER_CONTEXT__ is a global
        global.__NEXT_DEV_SERVER_CONTEXT__ = {};
    }
    // @ts-expect-error __NEXT_DEV_SERVER_CONTEXT__ is a global
    if (!global.__NEXT_DEV_SERVER_CONTEXT__[name]) {
        // @ts-expect-error __NEXT_DEV_SERVER_CONTEXT__ is a global
        global.__NEXT_DEV_SERVER_CONTEXT__[name] = (0, _react).createServerContext(name, defaultValue);
    }
    // @ts-expect-error __NEXT_DEV_SERVER_CONTEXT__ is a global
    return global.__NEXT_DEV_SERVER_CONTEXT__[name];
};
const CONTEXT_NAMES = {
    HeadersContext: 'HeadersContext',
    PreviewDataContext: 'PreviewDataContext',
    CookiesContext: 'CookiesContext',
    StaticGenerationContext: 'StaticGenerationContext',
    FetchRevalidateContext: 'FetchRevalidateContext'
};
exports.CONTEXT_NAMES = CONTEXT_NAMES;
const HeadersContext = createContext(CONTEXT_NAMES.HeadersContext);
exports.HeadersContext = HeadersContext;
const PreviewDataContext = createContext(CONTEXT_NAMES.PreviewDataContext);
exports.PreviewDataContext = PreviewDataContext;
const CookiesContext = createContext(CONTEXT_NAMES.CookiesContext);
exports.CookiesContext = CookiesContext;
const StaticGenerationContext = createContext(CONTEXT_NAMES.StaticGenerationContext, {
    isStaticGeneration: false
});
exports.StaticGenerationContext = StaticGenerationContext;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=hooks-server-context.js.map