"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _hotDevClient = _interop_require_default(require("./error-overlay/hot-dev-client"));
var _websocket = require("./error-overlay/websocket");
var _default = ()=>{
    const devClient = (0, _hotDevClient).default();
    devClient.subscribeToHmrEvent((obj)=>{
        if (obj.action === 'reloadPage') {
            (0, _websocket).sendMessage(JSON.stringify({
                event: 'client-reload-page',
                clientId: window.__nextDevClientId
            }));
            return window.location.reload();
        }
        if (obj.action === 'removedPage') {
            const [page] = obj.data;
            if (page === window.next.router.pathname) {
                (0, _websocket).sendMessage(JSON.stringify({
                    event: 'client-removed-page',
                    clientId: window.__nextDevClientId,
                    page
                }));
                return window.location.reload();
            }
            return;
        }
        if (obj.action === 'addedPage') {
            const [page] = obj.data;
            if (page === window.next.router.pathname && typeof window.next.router.components[page] === 'undefined') {
                (0, _websocket).sendMessage(JSON.stringify({
                    event: 'client-added-page',
                    clientId: window.__nextDevClientId,
                    page
                }));
                return window.location.reload();
            }
            return;
        }
        throw new Error('Unexpected action ' + obj.action);
    });
    return devClient;
};
exports.default = _default;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=webpack-hot-middleware-client.js.map