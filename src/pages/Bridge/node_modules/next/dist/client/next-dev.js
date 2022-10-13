"use strict";
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _ = require("./");
var _onDemandEntriesClient = _interop_require_default(require("./dev/on-demand-entries-client"));
var _webpackHotMiddlewareClient = _interop_require_default(require("./dev/webpack-hot-middleware-client"));
var _devBuildWatcher = _interop_require_default(require("./dev/dev-build-watcher"));
var _fouc = require("./dev/fouc");
var _websocket = require("./dev/error-overlay/websocket");
var _querystring = require("../shared/lib/router/utils/querystring");
if (!window._nextSetupHydrationWarning) {
    const origConsoleError = window.console.error;
    window.console.error = (...args)=>{
        const isHydrateError = args.some((arg)=>typeof arg === 'string' && arg.match(/(hydration|content does not match|did not match)/i));
        if (isHydrateError) {
            args = [
                ...args,
                `\n\nSee more info here: https://nextjs.org/docs/messages/react-hydration-error`, 
            ];
        }
        origConsoleError.apply(window.console, args);
    };
    window._nextSetupHydrationWarning = true;
}
window.next = {
    version: _.version,
    // router is initialized later so it has to be live-binded
    get router () {
        return _.router;
    },
    emitter: _.emitter
};
const webpackHMR = (0, _webpackHotMiddlewareClient).default();
(0, _).initialize({
    webpackHMR
}).then(({ assetPrefix  })=>{
    (0, _websocket).connectHMR({
        assetPrefix,
        path: '/_next/webpack-hmr'
    });
    return (0, _).hydrate({
        beforeRender: _fouc.displayContent
    }).then(()=>{
        (0, _onDemandEntriesClient).default();
        let buildIndicatorHandler = ()=>{};
        function devPagesManifestListener(event) {
            if (event.data.indexOf('devPagesManifest') !== -1) {
                fetch(`${assetPrefix}/_next/static/development/_devPagesManifest.json`).then((res)=>res.json()).then((manifest)=>{
                    window.__DEV_PAGES_MANIFEST = manifest;
                }).catch((err)=>{
                    console.log(`Failed to fetch devPagesManifest`, err);
                });
            } else if (event.data.indexOf('middlewareChanges') !== -1) {
                return window.location.reload();
            } else if (event.data.indexOf('serverOnlyChanges') !== -1) {
                const { pages  } = JSON.parse(event.data);
                // Make sure to reload when the dev-overlay is showing for an
                // API route
                if (pages.includes(_.router.query.__NEXT_PAGE)) {
                    return window.location.reload();
                }
                if (!_.router.clc && pages.includes(_.router.pathname)) {
                    console.log('Refreshing page data due to server-side change');
                    buildIndicatorHandler('building');
                    const clearIndicator = ()=>buildIndicatorHandler('built');
                    _.router.replace(_.router.pathname + '?' + String((0, _querystring).assign((0, _querystring).urlQueryToSearchParams(_.router.query), new URLSearchParams(location.search))), _.router.asPath, {
                        scroll: false
                    }).catch(()=>{
                        // trigger hard reload when failing to refresh data
                        // to show error overlay properly
                        location.reload();
                    }).finally(clearIndicator);
                }
            }
        }
        (0, _websocket).addMessageListener(devPagesManifestListener);
        if (process.env.__NEXT_BUILD_INDICATOR) {
            (0, _devBuildWatcher).default((handler)=>{
                buildIndicatorHandler = handler;
            }, process.env.__NEXT_BUILD_INDICATOR_POSITION);
        }
    });
}).catch((err)=>{
    console.error('Error was not caught', err);
});

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=next-dev.js.map