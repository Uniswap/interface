"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.useTrackStaticGeneration = useTrackStaticGeneration;
exports.useHeaders = useHeaders;
exports.usePreviewData = usePreviewData;
exports.useCookies = useCookies;
var _react = require("react");
var _hooksServerContext = require("./hooks-server-context");
function useTrackStaticGeneration() {
    return (0, _react).useContext(_hooksServerContext.StaticGenerationContext);
}
function useStaticGenerationBailout(reason) {
    const staticGenerationContext = useTrackStaticGeneration();
    if (staticGenerationContext.isStaticGeneration) {
        // TODO: honor the dynamic: 'force-static'
        staticGenerationContext.revalidate = 0;
        throw new _hooksServerContext.DynamicServerError(reason);
    }
}
function useHeaders() {
    useStaticGenerationBailout('useHeaders');
    return (0, _react).useContext(_hooksServerContext.HeadersContext);
}
function usePreviewData() {
    useStaticGenerationBailout('usePreviewData');
    return (0, _react).useContext(_hooksServerContext.PreviewDataContext);
}
function useCookies() {
    useStaticGenerationBailout('useCookies');
    return (0, _react).useContext(_hooksServerContext.CookiesContext);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=hooks-server.js.map