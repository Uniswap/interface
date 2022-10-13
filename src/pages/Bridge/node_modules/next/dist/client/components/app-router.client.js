"client";
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = AppRouter;
exports.fetchServerResponse = fetchServerResponse;
var _async_to_generator = require("@swc/helpers/lib/_async_to_generator.js").default;
var _interop_require_wildcard = require("@swc/helpers/lib/_interop_require_wildcard.js").default;
var _react = _interop_require_wildcard(require("react"));
var _reactServerDomWebpack = require("next/dist/compiled/react-server-dom-webpack");
var _appRouterContext = require("../../shared/lib/app-router-context");
var _reducer = require("./reducer");
var _hooksClientContext = require("./hooks-client-context");
var _useReducerWithDevtools = require("./use-reducer-with-devtools");
function AppRouter({ initialTree , initialCanonicalUrl , children , hotReloader  }) {
    const initialState = (0, _react).useMemo(()=>{
        return {
            tree: initialTree,
            cache: {
                data: null,
                subTreeData: children,
                parallelRoutes: typeof window === 'undefined' ? new Map() : initialParallelRoutes
            },
            prefetchCache: new Map(),
            pushRef: {
                pendingPush: false,
                mpaNavigation: false
            },
            focusAndScrollRef: {
                apply: false
            },
            canonicalUrl: initialCanonicalUrl + // Hash is read as the initial value for canonicalUrl in the browser
            // This is safe to do as canonicalUrl can't be rendered, it's only used to control the history updates the useEffect further down.
            (typeof window !== 'undefined' ? window.location.hash : '')
        };
    }, [
        children,
        initialCanonicalUrl,
        initialTree
    ]);
    const [{ tree , cache , prefetchCache , pushRef , focusAndScrollRef , canonicalUrl  }, dispatch, sync, ] = (0, _useReducerWithDevtools).useReducerWithReduxDevtools(_reducer.reducer, initialState);
    (0, _react).useEffect(()=>{
        // Ensure initialParallelRoutes is cleaned up from memory once it's used.
        initialParallelRoutes = null;
    }, []);
    // Add memoized pathname/query for useSearchParams and usePathname.
    const { searchParams , pathname  } = (0, _react).useMemo(()=>{
        const url = new URL(canonicalUrl, typeof window === 'undefined' ? 'http://n' : window.location.href);
        // Convert searchParams to a plain object to match server-side.
        const searchParamsObj = {};
        url.searchParams.forEach((value, key)=>{
            searchParamsObj[key] = value;
        });
        return {
            searchParams: searchParamsObj,
            pathname: url.pathname
        };
    }, [
        canonicalUrl
    ]);
    /**
   * Server response that only patches the cache and tree.
   */ const changeByServerResponse = (0, _react).useCallback((previousTree, flightData)=>{
        dispatch({
            type: _reducer.ACTION_SERVER_PATCH,
            flightData,
            previousTree,
            cache: {
                data: null,
                subTreeData: null,
                parallelRoutes: new Map()
            },
            mutable: {}
        });
    }, [
        dispatch
    ]);
    /**
   * The app router that is exposed through `useRouter`. It's only concerned with dispatching actions to the reducer, does not hold state.
   */ const appRouter = (0, _react).useMemo(()=>{
        const navigate = (href, navigateType, forceOptimisticNavigation)=>{
            return dispatch({
                type: _reducer.ACTION_NAVIGATE,
                url: new URL(href, location.origin),
                forceOptimisticNavigation,
                navigateType,
                cache: {
                    data: null,
                    subTreeData: null,
                    parallelRoutes: new Map()
                },
                mutable: {}
            });
        };
        const routerInstance = {
            // TODO-APP: implement prefetching of flight
            prefetch: _async_to_generator(function*(href) {
                // If prefetch has already been triggered, don't trigger it again.
                if (prefetched.has(href)) {
                    return;
                }
                prefetched.add(href);
                const url = new URL(href, location.origin);
                try {
                    var // initialTree is used when history.state.tree is missing because the history state is set in `useEffect` below, it being missing means this is the hydration case.
                    ref;
                    // TODO-APP: handle case where history.state is not the new router history entry
                    const r = fetchServerResponse(url, ((ref = window.history.state) == null ? void 0 : ref.tree) || initialTree, true);
                    const [flightData] = yield r;
                    // @ts-ignore startTransition exists
                    _react.default.startTransition(()=>{
                        dispatch({
                            type: _reducer.ACTION_PREFETCH,
                            url,
                            flightData
                        });
                    });
                } catch (err) {
                    console.error('PREFETCH ERROR', err);
                }
            }),
            replace: (href, options = {})=>{
                // @ts-ignore startTransition exists
                _react.default.startTransition(()=>{
                    navigate(href, 'replace', Boolean(options.forceOptimisticNavigation));
                });
            },
            push: (href, options = {})=>{
                // @ts-ignore startTransition exists
                _react.default.startTransition(()=>{
                    navigate(href, 'push', Boolean(options.forceOptimisticNavigation));
                });
            },
            reload: ()=>{
                // @ts-ignore startTransition exists
                _react.default.startTransition(()=>{
                    dispatch({
                        type: _reducer.ACTION_RELOAD,
                        // TODO-APP: revisit if this needs to be passed.
                        cache: {
                            data: null,
                            subTreeData: null,
                            parallelRoutes: new Map()
                        },
                        mutable: {}
                    });
                });
            }
        };
        return routerInstance;
    }, [
        dispatch,
        initialTree
    ]);
    (0, _react).useEffect(()=>{
        // When mpaNavigation flag is set do a hard navigation to the new url.
        if (pushRef.mpaNavigation) {
            window.location.href = canonicalUrl;
            return;
        }
        // Identifier is shortened intentionally.
        // __NA is used to identify if the history entry can be handled by the app-router.
        // __N is used to identify if the history entry can be handled by the old router.
        const historyState = {
            __NA: true,
            tree
        };
        if (pushRef.pendingPush) {
            // This intentionally mutates React state, pushRef is overwritten to ensure additional push/replace calls do not trigger an additional history entry.
            pushRef.pendingPush = false;
            window.history.pushState(historyState, '', canonicalUrl);
        } else {
            window.history.replaceState(historyState, '', canonicalUrl);
        }
        sync();
    }, [
        tree,
        pushRef,
        canonicalUrl,
        sync
    ]);
    // Add `window.nd` for debugging purposes.
    // This is not meant for use in applications as concurrent rendering will affect the cache/tree/router.
    if (typeof window !== 'undefined') {
        // @ts-ignore this is for debugging
        window.nd = {
            router: appRouter,
            cache,
            prefetchCache,
            tree
        };
    }
    /**
   * Handle popstate event, this is used to handle back/forward in the browser.
   * By default dispatches ACTION_RESTORE, however if the history entry was not pushed/replaced by app-router it will reload the page.
   * That case can happen when the old router injected the history entry.
   */ const onPopState = (0, _react).useCallback(({ state  })=>{
        if (!state) {
            // TODO-APP: this case only happens when pushState/replaceState was called outside of Next.js. It should probably reload the page in this case.
            return;
        }
        // TODO-APP: this case happens when pushState/replaceState was called outside of Next.js or when the history entry was pushed by the old router.
        // It reloads the page in this case but we might have to revisit this as the old router ignores it.
        if (!state.__NA) {
            window.location.reload();
            return;
        }
        // @ts-ignore useTransition exists
        // TODO-APP: Ideally the back button should not use startTransition as it should apply the updates synchronously
        // Without startTransition works if the cache is there for this path
        _react.default.startTransition(()=>{
            dispatch({
                type: _reducer.ACTION_RESTORE,
                url: new URL(window.location.href),
                tree: state.tree
            });
        });
    }, [
        dispatch
    ]);
    // Register popstate event to call onPopstate.
    (0, _react).useEffect(()=>{
        window.addEventListener('popstate', onPopState);
        return ()=>{
            window.removeEventListener('popstate', onPopState);
        };
    }, [
        onPopState
    ]);
    return /*#__PURE__*/ _react.default.createElement(_hooksClientContext.PathnameContext.Provider, {
        value: pathname
    }, /*#__PURE__*/ _react.default.createElement(_hooksClientContext.SearchParamsContext.Provider, {
        value: searchParams
    }, /*#__PURE__*/ _react.default.createElement(_appRouterContext.GlobalLayoutRouterContext.Provider, {
        value: {
            changeByServerResponse,
            tree,
            focusAndScrollRef
        }
    }, /*#__PURE__*/ _react.default.createElement(_appRouterContext.AppRouterContext.Provider, {
        value: appRouter
    }, /*#__PURE__*/ _react.default.createElement(_appRouterContext.LayoutRouterContext.Provider, {
        value: {
            childNodes: cache.parallelRoutes,
            tree: tree,
            // Root node always has `url`
            // Provided in AppTreeContext to ensure it can be overwritten in layout-router
            url: canonicalUrl
        }
    }, /*#__PURE__*/ _react.default.createElement(ErrorOverlay, null, // ErrorOverlay intentionally only wraps the children of app-router.
    cache.subTreeData), // HotReloader uses the router tree and router.reload() in order to apply Server Component changes.
    hotReloader)))));
}
'client';
function fetchServerResponse(url, flightRouterState, prefetch) {
    return _fetchServerResponse.apply(this, arguments);
}
function _fetchServerResponse() {
    _fetchServerResponse = _async_to_generator(function*(url, flightRouterState, prefetch) {
        const flightUrl = new URL(url);
        const searchParams = flightUrl.searchParams;
        // Enable flight response
        searchParams.append('__flight__', '1');
        // Provide the current router state
        searchParams.append('__flight_router_state_tree__', JSON.stringify(flightRouterState));
        if (prefetch) {
            searchParams.append('__flight_prefetch__', '1');
        }
        const res = yield fetch(flightUrl.toString());
        // Handle the `fetch` readable stream that can be unwrapped by `React.use`.
        const flightData = yield (0, _reactServerDomWebpack).createFromFetch(Promise.resolve(res));
        return [
            flightData
        ];
    });
    return _fetchServerResponse.apply(this, arguments);
}
/**
 * Renders development error overlay when NODE_ENV is development.
 */ function ErrorOverlay({ children  }) {
    if (process.env.NODE_ENV === 'production') {
        return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, children);
    } else {
        const { ReactDevOverlay ,  } = require('next/dist/compiled/@next/react-dev-overlay/dist/client');
        return /*#__PURE__*/ _react.default.createElement(ReactDevOverlay, {
            globalOverlay: true
        }, children);
    }
}
// Ensure the initialParallelRoutes are not combined because of double-rendering in the browser with Strict Mode.
// TODO-APP: move this back into AppRouter
let initialParallelRoutes = typeof window === 'undefined' ? null : new Map();
const prefetched = new Set();

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=app-router.client.js.map