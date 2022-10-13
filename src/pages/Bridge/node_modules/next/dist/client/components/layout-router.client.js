"client";
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = OuterLayoutRouter;
exports.InnerLayoutRouter = InnerLayoutRouter;
var _extends = require("@swc/helpers/lib/_extends.js").default;
var _interop_require_wildcard = require("@swc/helpers/lib/_interop_require_wildcard.js").default;
var _react = _interop_require_wildcard(require("react"));
var _appRouterContext = require("../../shared/lib/app-router-context");
var _appRouterClient = require("./app-router.client");
function OuterLayoutRouter({ parallelRouterKey , segmentPath , childProp , error , loading , template , rootLayoutIncluded  }) {
    const { childNodes , tree , url  } = (0, _react).useContext(_appRouterContext.LayoutRouterContext);
    // Get the current parallelRouter cache node
    let childNodesForParallelRouter = childNodes.get(parallelRouterKey);
    // If the parallel router cache node does not exist yet, create it.
    // This writes to the cache when there is no item in the cache yet. It never *overwrites* existing cache items which is why it's safe in concurrent mode.
    if (!childNodesForParallelRouter) {
        childNodes.set(parallelRouterKey, new Map());
        childNodesForParallelRouter = childNodes.get(parallelRouterKey);
    }
    // Get the active segment in the tree
    // The reason arrays are used in the data format is that these are transferred from the server to the browser so it's optimized to save bytes.
    const treeSegment = tree[1][parallelRouterKey][0];
    const childPropSegment = Array.isArray(childProp.segment) ? childProp.segment[1] : childProp.segment;
    // If segment is an array it's a dynamic route and we want to read the dynamic route value as the segment to get from the cache.
    const currentChildSegment = Array.isArray(treeSegment) ? treeSegment[1] : treeSegment;
    /**
   * Decides which segments to keep rendering, all segments that are not active will be wrapped in `<Offscreen>`.
   */ // TODO-APP: Add handling of `<Offscreen>` when it's available.
    const preservedSegments = [
        currentChildSegment
    ];
    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, preservedSegments.map((preservedSegment)=>{
        return(/*
            - Error boundary
              - Only renders error boundary if error component is provided.
              - Rendered for each segment to ensure they have their own error state.
            - Loading boundary
              - Only renders suspense boundary if loading components is provided.
              - Rendered for each segment to ensure they have their own loading state.
              - Passed to the router during rendering to ensure it can be immediately rendered when suspending on a Flight fetch.
          */ /*#__PURE__*/ _react.default.createElement(_appRouterContext.TemplateContext.Provider, {
            key: preservedSegment,
            value: /*#__PURE__*/ _react.default.createElement(ErrorBoundary, {
                errorComponent: error
            }, /*#__PURE__*/ _react.default.createElement(LoadingBoundary, {
                loading: loading
            }, /*#__PURE__*/ _react.default.createElement(InnerLayoutRouter, {
                parallelRouterKey: parallelRouterKey,
                url: url,
                tree: tree,
                childNodes: childNodesForParallelRouter,
                childProp: childPropSegment === preservedSegment ? childProp : null,
                segmentPath: segmentPath,
                path: preservedSegment,
                isActive: currentChildSegment === preservedSegment,
                rootLayoutIncluded: rootLayoutIncluded
            })))
        }, template));
    }));
}
'client';
// import { matchSegment } from './match-segments'
/**
 * Check if every segment in array a and b matches
 */ // function equalSegmentPaths(a: Segment[], b: Segment[]) {
//   // Comparing length is a fast path.
//   return a.length === b.length && a.every((val, i) => matchSegment(val, b[i]))
// }
/**
 * Check if flightDataPath matches layoutSegmentPath
 */ // function segmentPathMatches(
//   flightDataPath: FlightDataPath,
//   layoutSegmentPath: FlightSegmentPath
// ): boolean {
//   // The last three items are the current segment, tree, and subTreeData
//   const pathToLayout = flightDataPath.slice(0, -3)
//   return equalSegmentPaths(layoutSegmentPath, pathToLayout)
// }
/**
 * Add refetch marker to router state at the point of the current layout segment.
 * This ensures the response returned is not further down than the current layout segment.
 */ function walkAddRefetch(segmentPathToWalk, treeToRecreate) {
    if (segmentPathToWalk) {
        const [segment, parallelRouteKey] = segmentPathToWalk;
        const isLast = segmentPathToWalk.length === 2;
        if (treeToRecreate[0] === segment) {
            if (treeToRecreate[1].hasOwnProperty(parallelRouteKey)) {
                if (isLast) {
                    const subTree = walkAddRefetch(undefined, treeToRecreate[1][parallelRouteKey]);
                    return [
                        treeToRecreate[0],
                        _extends({}, treeToRecreate[1], {
                            [parallelRouteKey]: [
                                subTree[0],
                                subTree[1],
                                subTree[2],
                                'refetch', 
                            ]
                        }), 
                    ];
                }
                return [
                    treeToRecreate[0],
                    _extends({}, treeToRecreate[1], {
                        [parallelRouteKey]: walkAddRefetch(segmentPathToWalk.slice(2), treeToRecreate[1][parallelRouteKey])
                    }), 
                ];
            }
        }
    }
    return treeToRecreate;
}
/**
 * Used to cache in createInfinitePromise
 */ let infinitePromise;
/**
 * Create a Promise that does not resolve. This is used to suspend when data is not available yet.
 */ function createInfinitePromise() {
    if (!infinitePromise) {
        // Only create the Promise once
        infinitePromise = new Promise(()=>{
        // This is used to debug when the rendering is never updated.
        // setTimeout(() => {
        //   infinitePromise = new Error('Infinite promise')
        //   resolve()
        // }, 5000)
        });
    }
    return infinitePromise;
}
/**
 * Check if the top of the HTMLElement is in the viewport.
 */ function topOfElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0;
}
function InnerLayoutRouter({ parallelRouterKey , url , childNodes , childProp , segmentPath , tree , // TODO-APP: implement `<Offscreen>` when available.
// isActive,
path , rootLayoutIncluded  }) {
    const { changeByServerResponse , tree: fullTree , focusAndScrollRef ,  } = (0, _react).useContext(_appRouterContext.GlobalLayoutRouterContext);
    const focusAndScrollElementRef = (0, _react).useRef(null);
    (0, _react).useEffect(()=>{
        // Handle scroll and focus, it's only applied once in the first useEffect that triggers that changed.
        if (focusAndScrollRef.apply && focusAndScrollElementRef.current) {
            // State is mutated to ensure that the focus and scroll is applied only once.
            focusAndScrollRef.apply = false;
            // Set focus on the element
            focusAndScrollElementRef.current.focus();
            // Only scroll into viewport when the layout is not visible currently.
            if (!topOfElementInViewport(focusAndScrollElementRef.current)) {
                const htmlElement = document.documentElement;
                const existing = htmlElement.style.scrollBehavior;
                htmlElement.style.scrollBehavior = 'auto';
                focusAndScrollElementRef.current.scrollIntoView();
                htmlElement.style.scrollBehavior = existing;
            }
        }
    }, [
        focusAndScrollRef
    ]);
    // Read segment path from the parallel router cache node.
    let childNode = childNodes.get(path);
    // If childProp is available this means it's the Flight / SSR case.
    if (childProp && // TODO-APP: verify if this can be null based on user code
    childProp.current !== null && !childNode /*&&
    !childProp.partial*/ ) {
        // Add the segment's subTreeData to the cache.
        // This writes to the cache when there is no item in the cache yet. It never *overwrites* existing cache items which is why it's safe in concurrent mode.
        childNodes.set(path, {
            data: null,
            subTreeData: childProp.current,
            parallelRoutes: new Map()
        });
        // Mutates the prop in order to clean up the memory associated with the subTreeData as it is now part of the cache.
        childProp.current = null;
        // In the above case childNode was set on childNodes, so we have to get it from the cacheNodes again.
        childNode = childNodes.get(path);
    }
    // When childNode is not available during rendering client-side we need to fetch it from the server.
    if (!childNode) {
        /**
     * Router state with refetch marker added
     */ // TODO-APP: remove ''
        const refetchTree = walkAddRefetch([
            '',
            ...segmentPath
        ], fullTree);
        /**
     * Flight data fetch kicked off during render and put into the cache.
     */ childNodes.set(path, {
            data: (0, _appRouterClient).fetchServerResponse(new URL(url, location.origin), refetchTree),
            subTreeData: null,
            parallelRoutes: new Map()
        });
        // In the above case childNode was set on childNodes, so we have to get it from the cacheNodes again.
        childNode = childNodes.get(path);
    }
    // This case should never happen so it throws an error. It indicates there's a bug in the Next.js.
    if (!childNode) {
        throw new Error('Child node should always exist');
    }
    // This case should never happen so it throws an error. It indicates there's a bug in the Next.js.
    if (childNode.subTreeData && childNode.data) {
        throw new Error('Child node should not have both subTreeData and data');
    }
    // If cache node has a data request we have to unwrap response by `use` and update the cache.
    if (childNode.data) {
        // TODO-APP: error case
        /**
     * Flight response data
     */ // When the data has not resolved yet `use` will suspend here.
        const [flightData] = (0, _react).experimental_use(childNode.data);
        // Handle case when navigating to page in `pages` from `app`
        if (typeof flightData === 'string') {
            window.location.href = url;
            return null;
        }
        /**
     * If the fast path was triggered.
     * The fast path is when the returned Flight data path matches the layout segment path, then we can write the data to the cache in render instead of dispatching an action.
     */ let fastPath = false;
        // If there are multiple patches returned in the Flight data we need to dispatch to ensure a single render.
        // if (flightData.length === 1) {
        //   const flightDataPath = flightData[0]
        //   if (segmentPathMatches(flightDataPath, segmentPath)) {
        //     // Ensure data is set to null as subTreeData will be set in the cache now.
        //     childNode.data = null
        //     // Last item is the subtreeData
        //     // TODO-APP: routerTreePatch needs to be applied to the tree, handle it in render?
        //     const [, /* routerTreePatch */ subTreeData] = flightDataPath.slice(-2)
        //     // Add subTreeData into the cache
        //     childNode.subTreeData = subTreeData
        //     // This field is required for new items
        //     childNode.parallelRoutes = new Map()
        //     fastPath = true
        //   }
        // }
        // When the fast path is not used a new action is dispatched to update the tree and cache.
        if (!fastPath) {
            // segmentPath from the server does not match the layout's segmentPath
            childNode.data = null;
            // setTimeout is used to start a new transition during render, this is an intentional hack around React.
            setTimeout(()=>{
                // @ts-ignore startTransition exists
                _react.default.startTransition(()=>{
                    // TODO-APP: handle redirect
                    changeByServerResponse(fullTree, flightData);
                });
            });
            // Suspend infinitely as `changeByServerResponse` will cause a different part of the tree to be rendered.
            throw createInfinitePromise();
        }
    }
    // If cache node has no subTreeData and no data request we have to infinitely suspend as the data will likely flow in from another place.
    // TODO-APP: double check users can't return null in a component that will kick in here.
    if (!childNode.subTreeData) {
        throw createInfinitePromise();
    }
    const subtree = // The layout router context narrows down tree and childNodes at each level.
    /*#__PURE__*/ _react.default.createElement(_appRouterContext.LayoutRouterContext.Provider, {
        value: {
            tree: tree[1][parallelRouterKey],
            childNodes: childNode.parallelRoutes,
            // TODO-APP: overriding of url for parallel routes
            url: url
        }
    }, childNode.subTreeData);
    // Ensure root layout is not wrapped in a div as the root layout renders `<html>`
    return rootLayoutIncluded ? /*#__PURE__*/ _react.default.createElement("div", {
        ref: focusAndScrollElementRef
    }, subtree) : subtree;
}
/**
 * Renders suspense boundary with the provided "loading" property as the fallback.
 * If no loading property is provided it renders the children without a suspense boundary.
 */ function LoadingBoundary({ children , loading  }) {
    if (loading) {
        return /*#__PURE__*/ _react.default.createElement(_react.default.Suspense, {
            fallback: loading
        }, children);
    }
    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, children);
}
/**
 * Handles errors through `getDerivedStateFromError`.
 * Renders the provided error component and provides a way to `reset` the error boundary state.
 */ class ErrorBoundaryHandler extends _react.default.Component {
    static getDerivedStateFromError(error) {
        return {
            error
        };
    }
    render() {
        if (this.state.error) {
            return /*#__PURE__*/ _react.default.createElement(this.props.errorComponent, {
                error: this.state.error,
                reset: this.reset
            });
        }
        return this.props.children;
    }
    constructor(props){
        super(props);
        this.reset = ()=>{
            this.setState({
                error: null
            });
        };
        this.state = {
            error: null
        };
    }
}
/**
 * Renders error boundary with the provided "errorComponent" property as the fallback.
 * If no "errorComponent" property is provided it renders the children without an error boundary.
 */ function ErrorBoundary({ errorComponent , children  }) {
    if (errorComponent) {
        return /*#__PURE__*/ _react.default.createElement(ErrorBoundaryHandler, {
            errorComponent: errorComponent
        }, children);
    }
    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, children);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=layout-router.client.js.map