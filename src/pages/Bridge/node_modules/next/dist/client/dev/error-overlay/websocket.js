"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.addMessageListener = addMessageListener;
exports.sendMessage = sendMessage;
exports.connectHMR = connectHMR;
let source;
const eventCallbacks = [];
let lastActivity = Date.now();
function getSocketProtocol(assetPrefix) {
    let protocol = location.protocol;
    try {
        // assetPrefix is a url
        protocol = new URL(assetPrefix).protocol;
    } catch (_) {}
    return protocol === 'http:' ? 'ws' : 'wss';
}
function addMessageListener(cb) {
    eventCallbacks.push(cb);
}
function sendMessage(data) {
    if (!source || source.readyState !== source.OPEN) return;
    return source.send(data);
}
function connectHMR(options) {
    if (!options.timeout) {
        options.timeout = 5 * 1000;
    }
    function init() {
        if (source) source.close();
        function handleOnline() {
            if (options.log) console.log('[HMR] connected');
            lastActivity = Date.now();
        }
        function handleMessage(event) {
            lastActivity = Date.now();
            eventCallbacks.forEach((cb)=>{
                cb(event);
            });
        }
        let timer;
        function handleDisconnect() {
            clearInterval(timer);
            source.close();
            setTimeout(init, options.timeout);
        }
        timer = setInterval(function() {
            if (Date.now() - lastActivity > options.timeout) {
                handleDisconnect();
            }
        }, options.timeout / 2);
        const { hostname , port  } = location;
        const protocol = getSocketProtocol(options.assetPrefix || '');
        const assetPrefix = options.assetPrefix.replace(/^\/+/, '');
        let url = `${protocol}://${hostname}:${port}${assetPrefix ? `/${assetPrefix}` : ''}`;
        if (assetPrefix.startsWith('http')) {
            url = `${protocol}://${assetPrefix.split('://')[1]}`;
        }
        source = new window.WebSocket(`${url}${options.path}`);
        source.onopen = handleOnline;
        source.onerror = handleDisconnect;
        source.onmessage = handleMessage;
    }
    init();
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=websocket.js.map