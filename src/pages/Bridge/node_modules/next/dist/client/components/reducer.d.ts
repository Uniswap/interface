import type { CacheNode } from '../../shared/lib/app-router-context';
import type { FlightRouterState, FlightData, FlightSegmentPath } from '../../server/app-render';
export declare type FocusAndScrollRef = {
    /**
     * If focus and scroll should be set in the layout-router's useEffect()
     */
    apply: boolean;
};
export declare const ACTION_RELOAD = "reload";
export declare const ACTION_NAVIGATE = "navigate";
export declare const ACTION_RESTORE = "restore";
export declare const ACTION_SERVER_PATCH = "server-patch";
export declare const ACTION_PREFETCH = "prefetch";
/**
 * Reload triggers a reload of the full page data.
 * - fetches the Flight data and fills subTreeData at the root of the cache.
 * - The router state is updated at the root of the state tree.
 */
interface ReloadAction {
    type: typeof ACTION_RELOAD;
    cache: CacheNode;
    mutable: {
        previousTree?: FlightRouterState;
        patchedTree?: FlightRouterState;
    };
}
/**
 * Navigate triggers a navigation to the provided url. It supports a combination of `cacheType` (`hard` and `soft`) and `navigateType` (`push` and `replace`).
 *
 * `navigateType`:
 * - `push` - pushes a new history entry in the browser history
 * - `replace` - replaces the current history entry in the browser history
 *
 * `cacheType`:
 * - `hard` - Creates a new cache in one of two ways:
 *   - Not optimistic
 *      - Default if there is no loading.js.
 *      - Fetch data in the reducer and suspend there.
 *      - Copies the previous cache nodes as far as possible and applies new subTreeData.
 *      - Applies the new router state.
 *   - optimistic
 *      - Enabled when somewhere in the router state path to the page there is a loading.js.
 *      - Similar to `soft` but kicks off the data fetch in the reducer and applies `data` in the spot that should suspend.
 *      - This enables showing loading states while navigating.
 *      - Will trigger fast path or server-patch case in layout-router.
 * - `soft`
 *   - Reuses the existing cache.
 *   - Creates an optimistic router state that causes the fetch to start in layout-router when there is missing data.
 *   - If there is no missing data the existing cache data is rendered.
 */
interface NavigateAction {
    type: typeof ACTION_NAVIGATE;
    url: URL;
    navigateType: 'push' | 'replace';
    forceOptimisticNavigation: boolean;
    cache: CacheNode;
    mutable: {
        previousTree?: FlightRouterState;
        patchedTree?: FlightRouterState;
        useExistingCache?: true;
    };
}
/**
 * Restore applies the provided router state.
 * - Only used for `popstate` (back/forward navigation) where a known router state has to be applied.
 * - Router state is applied as-is from the history state.
 * - If any data is missing it will be fetched in layout-router during rendering and trigger fast path or server-patch case.
 * - If no data is missing the existing cached data is rendered.
 */
interface RestoreAction {
    type: typeof ACTION_RESTORE;
    url: URL;
    tree: FlightRouterState;
}
/**
 * Server-patch applies the provided Flight data to the cache and router tree.
 * - Only triggered in layout-router when the data can't be handled in the fast path.
 * - Main case where this is triggered is when a rewrite applies and Flight data for a different path is returned from the server.
 * - Creates a new cache and router state with the Flight data applied.
 */
interface ServerPatchAction {
    type: typeof ACTION_SERVER_PATCH;
    flightData: FlightData;
    previousTree: FlightRouterState;
    cache: CacheNode;
    mutable: {
        patchedTree?: FlightRouterState;
    };
}
interface PrefetchAction {
    type: typeof ACTION_PREFETCH;
    url: URL;
    flightData: FlightData;
}
interface PushRef {
    /**
     * If the app-router should push a new history entry in app-router's useEffect()
     */
    pendingPush: boolean;
    /**
     * Multi-page navigation through location.href.
     */
    mpaNavigation: boolean;
}
/**
 * Handles keeping the state of app-router.
 */
declare type AppRouterState = {
    /**
     * The router state, this is written into the history state in app-router using replaceState/pushState.
     * - Has to be serializable as it is written into the history state.
     * - Holds which segments are shown on the screen.
     * - Holds where loading states (loading.js) exists.
     */
    tree: FlightRouterState;
    /**
     * The cache holds React nodes for every segment that is shown on screen as well as previously shown segments and prefetched segments.
     * It also holds in-progress data requests.
     */
    cache: CacheNode;
    /**
     * Cache that holds prefetched Flight responses keyed by url
     */
    prefetchCache: Map<string, {
        flightSegmentPath: FlightSegmentPath;
        treePatch: FlightRouterState;
    }>;
    /**
     * Decides if the update should create a new history entry and if the navigation can't be handled by app-router.
     */
    pushRef: PushRef;
    /**
     * Decides if the update should apply scroll and focus management.
     */
    focusAndScrollRef: FocusAndScrollRef;
    /**
     * The canonical url that is pushed/replaced
     */
    canonicalUrl: string;
};
/**
 * Reducer that handles the app-router state updates.
 */
export declare function reducer(state: Readonly<AppRouterState>, action: Readonly<ReloadAction | NavigateAction | RestoreAction | ServerPatchAction | PrefetchAction>): AppRouterState;
export {};
