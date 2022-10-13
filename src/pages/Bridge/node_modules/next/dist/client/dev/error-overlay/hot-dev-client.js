"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = connect;
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _client = require("next/dist/compiled/@next/react-dev-overlay/dist/client");
var _stripAnsi = _interop_require_default(require("next/dist/compiled/strip-ansi"));
var _websocket = require("./websocket");
var _formatWebpackMessages = _interop_require_default(require("./format-webpack-messages"));
function connect() {
    (0, _client).register();
    (0, _websocket).addMessageListener((event)=>{
        if (event.data.indexOf('action') === -1) return;
        try {
            processMessage(event);
        } catch (ex) {
            console.warn('Invalid HMR message: ' + event.data + '\n', ex);
        }
    });
    return {
        subscribeToHmrEvent (handler) {
            customHmrEventHandler = handler;
        },
        onUnrecoverableError () {
            hadRuntimeError = true;
        }
    };
}
// This alternative WebpackDevServer combines the functionality of:
// https://github.com/webpack/webpack-dev-server/blob/webpack-1/client/index.js
// https://github.com/webpack/webpack/blob/webpack-1/hot/dev-server.js
// It only supports their simplest configuration (hot updates on same server).
// It makes some opinionated choices on top, like adding a syntax error overlay
// that looks similar to our console output. The error overlay is inspired by:
// https://github.com/glenjamin/webpack-hot-middleware
window.__nextDevClientId = Math.round(Math.random() * 100 + Date.now());
let hadRuntimeError = false;
let customHmrEventHandler;
// Remember some state related to hot module replacement.
var isFirstCompilation = true;
var mostRecentCompilationHash = null;
var hasCompileErrors = false;
function clearOutdatedErrors() {
    // Clean up outdated compile errors, if any.
    if (typeof console !== 'undefined' && typeof console.clear === 'function') {
        if (hasCompileErrors) {
            console.clear();
        }
    }
}
// Successful compilation.
function handleSuccess() {
    clearOutdatedErrors();
    const isHotUpdate = !isFirstCompilation || window.__NEXT_DATA__.page !== '/_error' && isUpdateAvailable();
    isFirstCompilation = false;
    hasCompileErrors = false;
    // Attempt to apply hot updates or reload.
    if (isHotUpdate) {
        tryApplyUpdates(function onSuccessfulHotUpdate(hasUpdates) {
            // Only dismiss it when we're sure it's a hot update.
            // Otherwise it would flicker right before the reload.
            onFastRefresh(hasUpdates);
        });
    }
}
// Compilation with warnings (e.g. ESLint).
function handleWarnings(warnings) {
    clearOutdatedErrors();
    const isHotUpdate = !isFirstCompilation;
    isFirstCompilation = false;
    hasCompileErrors = false;
    function printWarnings() {
        // Print warnings to the console.
        const formatted = (0, _formatWebpackMessages).default({
            warnings: warnings,
            errors: []
        });
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
            for(let i = 0; i < formatted.warnings.length; i++){
                if (i === 5) {
                    console.warn('There were more warnings in other files.\n' + 'You can find a complete log in the terminal.');
                    break;
                }
                console.warn((0, _stripAnsi).default(formatted.warnings[i]));
            }
        }
    }
    printWarnings();
    // Attempt to apply hot updates or reload.
    if (isHotUpdate) {
        tryApplyUpdates(function onSuccessfulHotUpdate(hasUpdates) {
            // Only dismiss it when we're sure it's a hot update.
            // Otherwise it would flicker right before the reload.
            onFastRefresh(hasUpdates);
        });
    }
}
// Compilation with errors (e.g. syntax error or missing modules).
function handleErrors(errors) {
    clearOutdatedErrors();
    isFirstCompilation = false;
    hasCompileErrors = true;
    // "Massage" webpack messages.
    var formatted = (0, _formatWebpackMessages).default({
        errors: errors,
        warnings: []
    });
    // Only show the first error.
    (0, _client).onBuildError(formatted.errors[0]);
    // Also log them to the console.
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
        for(var i = 0; i < formatted.errors.length; i++){
            console.error((0, _stripAnsi).default(formatted.errors[i]));
        }
    }
    // Do not attempt to reload now.
    // We will reload on next success instead.
    if (process.env.__NEXT_TEST_MODE) {
        if (self.__NEXT_HMR_CB) {
            self.__NEXT_HMR_CB(formatted.errors[0]);
            self.__NEXT_HMR_CB = null;
        }
    }
}
let startLatency = undefined;
function onFastRefresh(hasUpdates) {
    (0, _client).onBuildOk();
    if (hasUpdates) {
        (0, _client).onRefresh();
    }
    if (startLatency) {
        const endLatency = Date.now();
        const latency = endLatency - startLatency;
        console.log(`[Fast Refresh] done in ${latency}ms`);
        (0, _websocket).sendMessage(JSON.stringify({
            event: 'client-hmr-latency',
            id: window.__nextDevClientId,
            startTime: startLatency,
            endTime: endLatency
        }));
        if (self.__NEXT_HMR_LATENCY_CB) {
            self.__NEXT_HMR_LATENCY_CB(latency);
        }
    }
}
// There is a newer version of the code available.
function handleAvailableHash(hash) {
    // Update last known compilation hash.
    mostRecentCompilationHash = hash;
}
// Handle messages from the server.
function processMessage(e) {
    const obj = JSON.parse(e.data);
    switch(obj.action){
        case 'building':
            {
                startLatency = Date.now();
                console.log('[Fast Refresh] rebuilding');
                break;
            }
        case 'built':
        case 'sync':
            {
                if (obj.hash) {
                    handleAvailableHash(obj.hash);
                }
                const { errors , warnings  } = obj;
                const hasErrors = Boolean(errors && errors.length);
                if (hasErrors) {
                    (0, _websocket).sendMessage(JSON.stringify({
                        event: 'client-error',
                        errorCount: errors.length,
                        clientId: window.__nextDevClientId
                    }));
                    return handleErrors(errors);
                }
                const hasWarnings = Boolean(warnings && warnings.length);
                if (hasWarnings) {
                    (0, _websocket).sendMessage(JSON.stringify({
                        event: 'client-warning',
                        warningCount: warnings.length,
                        clientId: window.__nextDevClientId
                    }));
                    return handleWarnings(warnings);
                }
                (0, _websocket).sendMessage(JSON.stringify({
                    event: 'client-success',
                    clientId: window.__nextDevClientId
                }));
                return handleSuccess();
            }
        case 'serverComponentChanges':
            {
                (0, _websocket).sendMessage(JSON.stringify({
                    event: 'server-component-reload-page',
                    clientId: window.__nextDevClientId
                }));
                return window.location.reload();
            }
        default:
            {
                if (customHmrEventHandler) {
                    customHmrEventHandler(obj);
                    break;
                }
                break;
            }
    }
}
// Is there a newer version of this code available?
function isUpdateAvailable() {
    /* globals __webpack_hash__ */ // __webpack_hash__ is the hash of the current compilation.
    // It's a global variable injected by Webpack.
    return mostRecentCompilationHash !== __webpack_hash__;
}
// Webpack disallows updates in other states.
function canApplyUpdates() {
    return module.hot.status() === 'idle';
}
function afterApplyUpdates(fn) {
    if (canApplyUpdates()) {
        fn();
    } else {
        function handler(status) {
            if (status === 'idle') {
                module.hot.removeStatusHandler(handler);
                fn();
            }
        }
        module.hot.addStatusHandler(handler);
    }
}
// Attempt to update code on the fly, fall back to a hard reload.
function tryApplyUpdates(onHotUpdateSuccess) {
    if (!module.hot) {
        // HotModuleReplacementPlugin is not in Webpack configuration.
        console.error('HotModuleReplacementPlugin is not in Webpack configuration.');
        // window.location.reload();
        return;
    }
    if (!isUpdateAvailable() || !canApplyUpdates()) {
        (0, _client).onBuildOk();
        return;
    }
    function handleApplyUpdates(err, updatedModules) {
        if (err || hadRuntimeError || !updatedModules) {
            if (err) {
                console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
            } else if (hadRuntimeError) {
                console.warn('[Fast Refresh] performing full reload because your application had an unrecoverable error');
            }
            performFullReload(err);
            return;
        }
        const hasUpdates = Boolean(updatedModules.length);
        if (typeof onHotUpdateSuccess === 'function') {
            // Maybe we want to do something.
            onHotUpdateSuccess(hasUpdates);
        }
        if (isUpdateAvailable()) {
            // While we were updating, there was a new update! Do it again.
            tryApplyUpdates(hasUpdates ? _client.onBuildOk : onHotUpdateSuccess);
        } else {
            (0, _client).onBuildOk();
            if (process.env.__NEXT_TEST_MODE) {
                afterApplyUpdates(()=>{
                    if (self.__NEXT_HMR_CB) {
                        self.__NEXT_HMR_CB();
                        self.__NEXT_HMR_CB = null;
                    }
                });
            }
        }
    }
    // https://webpack.js.org/api/hot-module-replacement/#check
    module.hot.check(/* autoApply */ true).then((updatedModules)=>{
        handleApplyUpdates(null, updatedModules);
    }, (err)=>{
        handleApplyUpdates(err, null);
    });
}
function performFullReload(err) {
    const stackTrace = err && (err.stack && err.stack.split('\n').slice(0, 5).join('\n') || err.message || err + '');
    (0, _websocket).sendMessage(JSON.stringify({
        event: 'client-full-reload',
        stackTrace
    }));
    window.location.reload();
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=hot-dev-client.js.map