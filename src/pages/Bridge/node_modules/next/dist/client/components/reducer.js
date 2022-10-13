"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.reducer = reducer;
exports.ACTION_PREFETCH = exports.ACTION_SERVER_PATCH = exports.ACTION_RESTORE = exports.ACTION_NAVIGATE = exports.ACTION_RELOAD = void 0;
var _extends = require("@swc/helpers/lib/_extends.js").default;
var _react = require("react");
var _matchSegments = require("./match-segments");
var _appRouterClient = require("./app-router.client");
/**
 * Invalidate cache one level down from the router state.
 */ // TODO-APP: Verify if this needs to be recursive.
function invalidateCacheByRouterState(newCache, existingCache, routerState) {
    // Remove segment that we got data for so that it is filled in during rendering of subTreeData.
    for(const key in routerState[1]){
        const segmentForParallelRoute = routerState[1][key][0];
        const cacheKey = Array.isArray(segmentForParallelRoute) ? segmentForParallelRoute[1] : segmentForParallelRoute;
        const existingParallelRoutesCacheNode = existingCache.parallelRoutes.get(key);
        if (existingParallelRoutesCacheNode) {
            let parallelRouteCacheNode = new Map(existingParallelRoutesCacheNode);
            parallelRouteCacheNode.delete(cacheKey);
            newCache.parallelRoutes.set(key, parallelRouteCacheNode);
        }
    }
}
/**
 * Fill cache with subTreeData based on flightDataPath
 */ function fillCacheWithNewSubTreeData(newCache, existingCache, flightDataPath) {
    const isLastEntry = flightDataPath.length <= 4;
    const [parallelRouteKey, segment] = flightDataPath;
    const segmentForCache = Array.isArray(segment) ? segment[1] : segment;
    const existingChildSegmentMap = existingCache.parallelRoutes.get(parallelRouteKey);
    if (!existingChildSegmentMap) {
        // Bailout because the existing cache does not have the path to the leaf node
        // Will trigger lazy fetch in layout-router because of missing segment
        return;
    }
    let childSegmentMap = newCache.parallelRoutes.get(parallelRouteKey);
    if (!childSegmentMap || childSegmentMap === existingChildSegmentMap) {
        childSegmentMap = new Map(existingChildSegmentMap);
        newCache.parallelRoutes.set(parallelRouteKey, childSegmentMap);
    }
    const existingChildCacheNode = existingChildSegmentMap.get(segmentForCache);
    let childCacheNode = childSegmentMap.get(segmentForCache);
    // In case of last segment start the fetch at this level and don't copy further down.
    if (isLastEntry) {
        if (!childCacheNode || !childCacheNode.data || childCacheNode === existingChildCacheNode) {
            childCacheNode = {
                data: null,
                subTreeData: flightDataPath[3],
                // Ensure segments other than the one we got data for are preserved.
                parallelRoutes: existingChildCacheNode ? new Map(existingChildCacheNode.parallelRoutes) : new Map()
            };
            if (existingChildCacheNode) {
                invalidateCacheByRouterState(childCacheNode, existingChildCacheNode, flightDataPath[2]);
            }
            childSegmentMap.set(segmentForCache, childCacheNode);
        }
        return;
    }
    if (!childCacheNode || !existingChildCacheNode) {
        // Bailout because the existing cache does not have the path to the leaf node
        // Will trigger lazy fetch in layout-router because of missing segment
        return;
    }
    if (childCacheNode === existingChildCacheNode) {
        childCacheNode = {
            data: childCacheNode.data,
            subTreeData: childCacheNode.subTreeData,
            parallelRoutes: new Map(childCacheNode.parallelRoutes)
        };
        childSegmentMap.set(segmentForCache, childCacheNode);
    }
    fillCacheWithNewSubTreeData(childCacheNode, existingChildCacheNode, flightDataPath.slice(2));
}
/**
 * Fill cache up to the end of the flightSegmentPath, invalidating anything below it.
 */ function invalidateCacheBelowFlightSegmentPath(newCache, existingCache, flightSegmentPath) {
    const isLastEntry = flightSegmentPath.length <= 2;
    const [parallelRouteKey, segment] = flightSegmentPath;
    const segmentForCache = Array.isArray(segment) ? segment[1] : segment;
    const existingChildSegmentMap = existingCache.parallelRoutes.get(parallelRouteKey);
    if (!existingChildSegmentMap) {
        // Bailout because the existing cache does not have the path to the leaf node
        // Will trigger lazy fetch in layout-router because of missing segment
        return;
    }
    let childSegmentMap = newCache.parallelRoutes.get(parallelRouteKey);
    if (!childSegmentMap || childSegmentMap === existingChildSegmentMap) {
        childSegmentMap = new Map(existingChildSegmentMap);
        newCache.parallelRoutes.set(parallelRouteKey, childSegmentMap);
    }
    // In case of last entry don't copy further down.
    if (isLastEntry) {
        childSegmentMap.delete(segmentForCache);
        return;
    }
    const existingChildCacheNode = existingChildSegmentMap.get(segmentForCache);
    let childCacheNode = childSegmentMap.get(segmentForCache);
    if (!childCacheNode || !existingChildCacheNode) {
        // Bailout because the existing cache does not have the path to the leaf node
        // Will trigger lazy fetch in layout-router because of missing segment
        return;
    }
    if (childCacheNode === existingChildCacheNode) {
        childCacheNode = {
            data: childCacheNode.data,
            subTreeData: childCacheNode.subTreeData,
            parallelRoutes: new Map(childCacheNode.parallelRoutes)
        };
        childSegmentMap.set(segmentForCache, childCacheNode);
    }
    invalidateCacheBelowFlightSegmentPath(childCacheNode, existingChildCacheNode, flightSegmentPath.slice(2));
}
/**
 * Fill cache with subTreeData based on flightDataPath that was prefetched
 * This operation is append-only to the existing cache.
 */ function fillCacheWithPrefetchedSubTreeData(existingCache, flightDataPath) {
    const isLastEntry = flightDataPath.length <= 4;
    const [parallelRouteKey, segment] = flightDataPath;
    const segmentForCache = Array.isArray(segment) ? segment[1] : segment;
    const existingChildSegmentMap = existingCache.parallelRoutes.get(parallelRouteKey);
    if (!existingChildSegmentMap) {
        // Bailout because the existing cache does not have the path to the leaf node
        return;
    }
    const existingChildCacheNode = existingChildSegmentMap.get(segmentForCache);
    // In case of last segment start the fetch at this level and don't copy further down.
    if (isLastEntry) {
        if (!existingChildCacheNode) {
            existingChildSegmentMap.set(segmentForCache, {
                data: null,
                subTreeData: flightDataPath[3],
                parallelRoutes: new Map()
            });
        }
        return;
    }
    if (!existingChildCacheNode) {
        // Bailout because the existing cache does not have the path to the leaf node
        return;
    }
    fillCacheWithPrefetchedSubTreeData(existingChildCacheNode, flightDataPath.slice(2));
}
/**
 * Kick off fetch based on the common layout between two routes. Fill cache with data property holding the in-progress fetch.
 */ function fillCacheWithDataProperty(newCache, existingCache, segments, fetchResponse) {
    const isLastEntry = segments.length === 1;
    const parallelRouteKey = 'children';
    const [segment] = segments;
    const existingChildSegmentMap = existingCache.parallelRoutes.get(parallelRouteKey);
    if (!existingChildSegmentMap) {
        // Bailout because the existing cache does not have the path to the leaf node
        // Will trigger lazy fetch in layout-router because of missing segment
        return {
            bailOptimistic: true
        };
    }
    let childSegmentMap = newCache.parallelRoutes.get(parallelRouteKey);
    if (!childSegmentMap || childSegmentMap === existingChildSegmentMap) {
        childSegmentMap = new Map(existingChildSegmentMap);
        newCache.parallelRoutes.set(parallelRouteKey, childSegmentMap);
    }
    const existingChildCacheNode = existingChildSegmentMap.get(segment);
    let childCacheNode = childSegmentMap.get(segment);
    // In case of last segment start off the fetch at this level and don't copy further down.
    if (isLastEntry) {
        if (!childCacheNode || !childCacheNode.data || childCacheNode === existingChildCacheNode) {
            childSegmentMap.set(segment, {
                data: fetchResponse(),
                subTreeData: null,
                parallelRoutes: new Map()
            });
        }
        return;
    }
    if (!childCacheNode || !existingChildCacheNode) {
        // Start fetch in the place where the existing cache doesn't have the data yet.
        if (!childCacheNode) {
            childSegmentMap.set(segment, {
                data: fetchResponse(),
                subTreeData: null,
                parallelRoutes: new Map()
            });
        }
        return;
    }
    if (childCacheNode === existingChildCacheNode) {
        childCacheNode = {
            data: childCacheNode.data,
            subTreeData: childCacheNode.subTreeData,
            parallelRoutes: new Map(childCacheNode.parallelRoutes)
        };
        childSegmentMap.set(segment, childCacheNode);
    }
    return fillCacheWithDataProperty(childCacheNode, existingChildCacheNode, segments.slice(1), fetchResponse);
}
/**
 * Create optimistic version of router state based on the existing router state and segments.
 * This is used to allow rendering layout-routers up till the point where data is missing.
 */ function createOptimisticTree(segments, flightRouterState, _isFirstSegment, parentRefetch, _href) {
    const [existingSegment, existingParallelRoutes] = flightRouterState || [
        null,
        {}, 
    ];
    const segment = segments[0];
    const isLastSegment = segments.length === 1;
    const segmentMatches = existingSegment !== null && (0, _matchSegments).matchSegment(existingSegment, segment);
    const shouldRefetchThisLevel = !flightRouterState || !segmentMatches;
    let parallelRoutes = {};
    if (existingSegment !== null && segmentMatches) {
        parallelRoutes = existingParallelRoutes;
    }
    let childTree;
    if (!isLastSegment) {
        const childItem = createOptimisticTree(segments.slice(1), parallelRoutes ? parallelRoutes.children : null, false, parentRefetch || shouldRefetchThisLevel);
        childTree = childItem;
    }
    const result = [
        segment,
        _extends({}, parallelRoutes, childTree ? {
            children: childTree
        } : {}), 
    ];
    if (!parentRefetch && shouldRefetchThisLevel) {
        result[3] = 'refetch';
    }
    // TODO-APP: Revisit
    // Add url into the tree
    // if (isFirstSegment) {
    //   result[2] = href
    // }
    return result;
}
/**
 * Apply the router state from the Flight response. Creates a new router state tree.
 */ function applyRouterStatePatchToTree(flightSegmentPath, flightRouterState, treePatch) {
    const [segment, parallelRoutes /* , url */ ] = flightRouterState;
    // Root refresh
    if (flightSegmentPath.length === 1) {
        const tree = [
            ...treePatch
        ];
        // TODO-APP: revisit
        // if (url) {
        //   tree[2] = url
        // }
        return tree;
    }
    const [currentSegment, parallelRouteKey] = flightSegmentPath;
    // Tree path returned from the server should always match up with the current tree in the browser
    if (!(0, _matchSegments).matchSegment(currentSegment, segment)) {
        return null;
    }
    const lastSegment = flightSegmentPath.length === 2;
    let parallelRoutePatch;
    if (lastSegment) {
        parallelRoutePatch = treePatch;
    } else {
        parallelRoutePatch = applyRouterStatePatchToTree(flightSegmentPath.slice(2), parallelRoutes[parallelRouteKey], treePatch);
        if (parallelRoutePatch === null) {
            return null;
        }
    }
    const tree = [
        flightSegmentPath[0],
        _extends({}, parallelRoutes, {
            [parallelRouteKey]: parallelRoutePatch
        }), 
    ];
    // TODO-APP: Revisit
    // if (url) {
    //   tree[2] = url
    // }
    return tree;
}
function shouldHardNavigate(flightSegmentPath, flightRouterState, treePatch) {
    const [segment, parallelRoutes] = flightRouterState;
    // TODO-APP: Check if `as` can be replaced.
    const [currentSegment, parallelRouteKey] = flightSegmentPath;
    // If dynamic parameter in tree doesn't match up with segment path a hard navigation is triggered.
    if (Array.isArray(currentSegment) && !(0, _matchSegments).matchSegment(currentSegment, segment)) {
        return true;
    }
    const lastSegment = flightSegmentPath.length <= 2;
    if (lastSegment) {
        return false;
    }
    return shouldHardNavigate(flightSegmentPath.slice(2), parallelRoutes[parallelRouteKey], treePatch);
}
const ACTION_RELOAD = 'reload';
exports.ACTION_RELOAD = ACTION_RELOAD;
const ACTION_NAVIGATE = 'navigate';
exports.ACTION_NAVIGATE = ACTION_NAVIGATE;
const ACTION_RESTORE = 'restore';
exports.ACTION_RESTORE = ACTION_RESTORE;
const ACTION_SERVER_PATCH = 'server-patch';
exports.ACTION_SERVER_PATCH = ACTION_SERVER_PATCH;
const ACTION_PREFETCH = 'prefetch';
exports.ACTION_PREFETCH = ACTION_PREFETCH;
function reducer(state, action) {
    switch(action.type){
        case ACTION_NAVIGATE:
            {
                const { url , navigateType , cache , mutable , forceOptimisticNavigation  } = action;
                const { pathname , search , hash  } = url;
                const href = pathname + search + hash;
                const pendingPush = navigateType === 'push';
                // Handle concurrent rendering / strict mode case where the cache and tree were already populated.
                if (mutable.patchedTree && JSON.stringify(mutable.previousTree) === JSON.stringify(state.tree)) {
                    return {
                        // Set href.
                        canonicalUrl: href,
                        // TODO-APP: verify mpaNavigation not being set is correct here.
                        pushRef: {
                            pendingPush,
                            mpaNavigation: false
                        },
                        // All navigation requires scroll and focus management to trigger.
                        focusAndScrollRef: {
                            apply: true
                        },
                        // Apply cache.
                        cache: mutable.useExistingCache ? state.cache : cache,
                        prefetchCache: state.prefetchCache,
                        // Apply patched router state.
                        tree: mutable.patchedTree
                    };
                }
                const prefetchValues = state.prefetchCache.get(href);
                if (prefetchValues) {
                    // The one before last item is the router state tree patch
                    const { flightSegmentPath , treePatch  } = prefetchValues;
                    // Create new tree based on the flightSegmentPath and router state patch
                    const newTree = applyRouterStatePatchToTree(// TODO-APP: remove ''
                    [
                        '',
                        ...flightSegmentPath
                    ], state.tree, treePatch);
                    if (newTree !== null) {
                        mutable.previousTree = state.tree;
                        mutable.patchedTree = newTree;
                        const hardNavigate = // TODO-APP: Revisit if this is correct.
                        search !== location.search || shouldHardNavigate(// TODO-APP: remove ''
                        [
                            '',
                            ...flightSegmentPath
                        ], state.tree, newTree);
                        if (hardNavigate) {
                            // TODO-APP: segments.slice(1) strips '', we can get rid of '' altogether.
                            // Copy subTreeData for the root node of the cache.
                            cache.subTreeData = state.cache.subTreeData;
                            invalidateCacheBelowFlightSegmentPath(cache, state.cache, flightSegmentPath);
                        } else {
                            mutable.useExistingCache = true;
                        }
                        return {
                            // Set href.
                            canonicalUrl: href,
                            // Set pendingPush.
                            pushRef: {
                                pendingPush,
                                mpaNavigation: false
                            },
                            // All navigation requires scroll and focus management to trigger.
                            focusAndScrollRef: {
                                apply: true
                            },
                            // Apply patched cache.
                            cache: mutable.useExistingCache ? state.cache : cache,
                            prefetchCache: state.prefetchCache,
                            // Apply patched tree.
                            tree: newTree
                        };
                    }
                }
                // When doing a hard push there can be two cases: with optimistic tree and without
                // The with optimistic tree case only happens when the layouts have a loading state (loading.js)
                // The without optimistic tree case happens when there is no loading state, in that case we suspend in this reducer
                // forceOptimisticNavigation is used for links that have `prefetch={false}`.
                if (forceOptimisticNavigation) {
                    const segments = pathname.split('/');
                    // TODO-APP: figure out something better for index pages
                    segments.push('');
                    // Optimistic tree case.
                    // If the optimistic tree is deeper than the current state leave that deeper part out of the fetch
                    const optimisticTree = createOptimisticTree(segments, state.tree, true, false, href);
                    // Fill in the cache with blank that holds the `data` field.
                    // TODO-APP: segments.slice(1) strips '', we can get rid of '' altogether.
                    // Copy subTreeData for the root node of the cache.
                    cache.subTreeData = state.cache.subTreeData;
                    // Copy existing cache nodes as far as possible and fill in `data` property with the started data fetch.
                    // The `data` property is used to suspend in layout-router during render if it hasn't resolved yet by the time it renders.
                    const res = fillCacheWithDataProperty(cache, state.cache, segments.slice(1), ()=>(0, _appRouterClient).fetchServerResponse(url, optimisticTree));
                    // If optimistic fetch couldn't happen it falls back to the non-optimistic case.
                    if (!(res == null ? void 0 : res.bailOptimistic)) {
                        mutable.previousTree = state.tree;
                        mutable.patchedTree = optimisticTree;
                        return {
                            // Set href.
                            canonicalUrl: href,
                            // Set pendingPush.
                            pushRef: {
                                pendingPush,
                                mpaNavigation: false
                            },
                            // All navigation requires scroll and focus management to trigger.
                            focusAndScrollRef: {
                                apply: true
                            },
                            // Apply patched cache.
                            cache: cache,
                            prefetchCache: state.prefetchCache,
                            // Apply optimistic tree.
                            tree: optimisticTree
                        };
                    }
                }
                // Below is the not-optimistic case. Data is fetched at the root and suspended there without a suspense boundary.
                // If no in-flight fetch at the top, start it.
                if (!cache.data) {
                    cache.data = (0, _appRouterClient).fetchServerResponse(url, state.tree);
                }
                // Unwrap cache data with `use` to suspend here (in the reducer) until the fetch resolves.
                const [flightData] = (0, _react).experimental_use(cache.data);
                // Handle case when navigating to page in `pages` from `app`
                if (typeof flightData === 'string') {
                    return {
                        canonicalUrl: flightData,
                        // Enable mpaNavigation
                        pushRef: {
                            pendingPush: true,
                            mpaNavigation: true
                        },
                        // Don't apply scroll and focus management.
                        focusAndScrollRef: {
                            apply: false
                        },
                        cache: state.cache,
                        prefetchCache: state.prefetchCache,
                        tree: state.tree
                    };
                }
                // Remove cache.data as it has been resolved at this point.
                cache.data = null;
                // TODO-APP: Currently the Flight data can only have one item but in the future it can have multiple paths.
                const flightDataPath = flightData[0];
                // The one before last item is the router state tree patch
                const [treePatch] = flightDataPath.slice(-2);
                // Path without the last segment, router state, and the subTreeData
                const flightSegmentPath = flightDataPath.slice(0, -3);
                // Create new tree based on the flightSegmentPath and router state patch
                const newTree = applyRouterStatePatchToTree(// TODO-APP: remove ''
                [
                    '',
                    ...flightSegmentPath
                ], state.tree, treePatch);
                if (newTree === null) {
                    throw new Error('SEGMENT MISMATCH');
                }
                mutable.previousTree = state.tree;
                mutable.patchedTree = newTree;
                // Copy subTreeData for the root node of the cache.
                cache.subTreeData = state.cache.subTreeData;
                // Create a copy of the existing cache with the subTreeData applied.
                fillCacheWithNewSubTreeData(cache, state.cache, flightDataPath);
                return {
                    // Set href.
                    canonicalUrl: href,
                    // Set pendingPush.
                    pushRef: {
                        pendingPush,
                        mpaNavigation: false
                    },
                    // All navigation requires scroll and focus management to trigger.
                    focusAndScrollRef: {
                        apply: true
                    },
                    // Apply patched cache.
                    cache: cache,
                    prefetchCache: state.prefetchCache,
                    // Apply patched tree.
                    tree: newTree
                };
            }
        case ACTION_SERVER_PATCH:
            {
                const { flightData , previousTree , cache , mutable  } = action;
                // When a fetch is slow to resolve it could be that you navigated away while the request was happening or before the reducer runs.
                // In that case opt-out of applying the patch given that the data could be stale.
                if (JSON.stringify(previousTree) !== JSON.stringify(state.tree)) {
                    // TODO-APP: Handle tree mismatch
                    console.log('TREE MISMATCH');
                    // Keep everything as-is.
                    return state;
                }
                // Handle concurrent rendering / strict mode case where the cache and tree were already populated.
                if (mutable.patchedTree) {
                    return {
                        // Keep href as it was set during navigate / restore
                        canonicalUrl: state.canonicalUrl,
                        // Keep pushRef as server-patch only causes cache/tree update.
                        pushRef: state.pushRef,
                        // Keep focusAndScrollRef as server-patch only causes cache/tree update.
                        focusAndScrollRef: state.focusAndScrollRef,
                        // Apply patched router state
                        tree: mutable.patchedTree,
                        prefetchCache: state.prefetchCache,
                        // Apply patched cache
                        cache: cache
                    };
                }
                // Handle case when navigating to page in `pages` from `app`
                if (typeof flightData === 'string') {
                    return {
                        // Set href.
                        canonicalUrl: flightData,
                        // Enable mpaNavigation as this is a navigation that the app-router shouldn't handle.
                        pushRef: {
                            pendingPush: true,
                            mpaNavigation: true
                        },
                        // Don't apply scroll and focus management.
                        focusAndScrollRef: {
                            apply: false
                        },
                        // Other state is kept as-is.
                        cache: state.cache,
                        prefetchCache: state.prefetchCache,
                        tree: state.tree
                    };
                }
                // TODO-APP: Currently the Flight data can only have one item but in the future it can have multiple paths.
                const flightDataPath = flightData[0];
                // Slices off the last segment (which is at -3) as it doesn't exist in the tree yet
                const treePath = flightDataPath.slice(0, -3);
                const [treePatch] = flightDataPath.slice(-2);
                const newTree = applyRouterStatePatchToTree(// TODO-APP: remove ''
                [
                    '',
                    ...treePath
                ], state.tree, treePatch);
                if (newTree === null) {
                    throw new Error('SEGMENT MISMATCH');
                }
                mutable.patchedTree = newTree;
                // Copy subTreeData for the root node of the cache.
                cache.subTreeData = state.cache.subTreeData;
                fillCacheWithNewSubTreeData(cache, state.cache, flightDataPath);
                return {
                    // Keep href as it was set during navigate / restore
                    canonicalUrl: state.canonicalUrl,
                    // Keep pushRef as server-patch only causes cache/tree update.
                    pushRef: state.pushRef,
                    // Keep focusAndScrollRef as server-patch only causes cache/tree update.
                    focusAndScrollRef: state.focusAndScrollRef,
                    // Apply patched router state
                    tree: newTree,
                    prefetchCache: state.prefetchCache,
                    // Apply patched cache
                    cache: cache
                };
            }
        case ACTION_RESTORE:
            {
                const { url , tree  } = action;
                const href = url.pathname + url.search + url.hash;
                return {
                    // Set canonical url
                    canonicalUrl: href,
                    pushRef: state.pushRef,
                    focusAndScrollRef: state.focusAndScrollRef,
                    cache: state.cache,
                    prefetchCache: state.prefetchCache,
                    // Restore provided tree
                    tree: tree
                };
            }
        case ACTION_RELOAD:
            {
                const { cache , mutable  } = action;
                const href = state.canonicalUrl;
                // Handle concurrent rendering / strict mode case where the cache and tree were already populated.
                if (mutable.patchedTree && JSON.stringify(mutable.previousTree) === JSON.stringify(state.tree)) {
                    return {
                        // Set href.
                        canonicalUrl: href,
                        // set pendingPush (always false in this case).
                        pushRef: state.pushRef,
                        // Apply focus and scroll.
                        // TODO-APP: might need to disable this for Fast Refresh.
                        focusAndScrollRef: {
                            apply: true
                        },
                        cache: cache,
                        prefetchCache: state.prefetchCache,
                        tree: mutable.patchedTree
                    };
                }
                if (!cache.data) {
                    // Fetch data from the root of the tree.
                    cache.data = (0, _appRouterClient).fetchServerResponse(new URL(href, location.origin), [
                        state.tree[0],
                        state.tree[1],
                        state.tree[2],
                        'refetch', 
                    ]);
                }
                const [flightData] = (0, _react).experimental_use(cache.data);
                // Handle case when navigating to page in `pages` from `app`
                if (typeof flightData === 'string') {
                    return {
                        canonicalUrl: flightData,
                        pushRef: {
                            pendingPush: true,
                            mpaNavigation: true
                        },
                        focusAndScrollRef: {
                            apply: false
                        },
                        cache: state.cache,
                        prefetchCache: state.prefetchCache,
                        tree: state.tree
                    };
                }
                // Remove cache.data as it has been resolved at this point.
                cache.data = null;
                // TODO-APP: Currently the Flight data can only have one item but in the future it can have multiple paths.
                const flightDataPath = flightData[0];
                // FlightDataPath with more than two items means unexpected Flight data was returned
                if (flightDataPath.length !== 2) {
                    // TODO-APP: handle this case better
                    console.log('RELOAD FAILED');
                    return state;
                }
                // Given the path can only have two items the items are only the router state and subTreeData for the root.
                const [treePatch, subTreeData] = flightDataPath;
                const newTree = applyRouterStatePatchToTree(// TODO-APP: remove ''
                [
                    ''
                ], state.tree, treePatch);
                if (newTree === null) {
                    throw new Error('SEGMENT MISMATCH');
                }
                mutable.previousTree = state.tree;
                mutable.patchedTree = newTree;
                // Set subTreeData for the root node of the cache.
                cache.subTreeData = subTreeData;
                return {
                    // Set href, this doesn't reuse the state.canonicalUrl as because of concurrent rendering the href might change between dispatching and applying.
                    canonicalUrl: href,
                    // set pendingPush (always false in this case).
                    pushRef: state.pushRef,
                    // TODO-APP: might need to disable this for Fast Refresh.
                    focusAndScrollRef: {
                        apply: false
                    },
                    // Apply patched cache.
                    cache: cache,
                    prefetchCache: state.prefetchCache,
                    // Apply patched router state.
                    tree: newTree
                };
            }
        case ACTION_PREFETCH:
            {
                const { url , flightData  } = action;
                // TODO-APP: Implement prefetch for hard navigation
                if (typeof flightData === 'string') {
                    return state;
                }
                const { pathname , search , hash  } = url;
                const href = pathname + search + hash;
                // TODO-APP: Currently the Flight data can only have one item but in the future it can have multiple paths.
                const flightDataPath = flightData[0];
                // The one before last item is the router state tree patch
                const [treePatch, subTreeData] = flightDataPath.slice(-2);
                // TODO-APP: Verify if `null` can't be returned from user code.
                // If subTreeData is null the prefetch did not provide a component tree.
                if (subTreeData !== null) {
                    fillCacheWithPrefetchedSubTreeData(state.cache, flightDataPath);
                }
                // Create new tree based on the flightSegmentPath and router state patch
                state.prefetchCache.set(href, {
                    // Path without the last segment, router state, and the subTreeData
                    flightSegmentPath: flightDataPath.slice(0, -2),
                    treePatch
                });
                return state;
            }
        // This case should never be hit as dispatch is strongly typed.
        default:
            throw new Error('Unknown action');
    }
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=reducer.js.map