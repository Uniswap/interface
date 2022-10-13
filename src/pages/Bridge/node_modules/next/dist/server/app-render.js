"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderToHTMLOrFlight = renderToHTMLOrFlight;
var _react = _interopRequireWildcard(require("react"));
var _querystring = require("querystring");
var _reactServerDomWebpack = require("next/dist/compiled/react-server-dom-webpack");
var _writerBrowserServer = require("next/dist/compiled/react-server-dom-webpack/writer.browser.server");
var _renderResult = _interopRequireDefault(require("./render-result"));
var _nodeWebStreamsHelper = require("./node-web-streams-helper");
var _htmlescape = require("./htmlescape");
var _utils = require("./utils");
var _matchSegments = require("../client/components/match-segments");
var _flushEffects = require("../shared/lib/flush-effects");
var _internalUtils = require("./internal-utils");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache() {
    if (typeof WeakMap !== "function") return null;
    var cache = new WeakMap();
    _getRequireWildcardCache = function() {
        return cache;
    };
    return cache;
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache();
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
// this needs to be required lazily so that `next-server` can set
// the env before we require
const ReactDOMServer = _utils.shouldUseReactRoot ? require("react-dom/server.browser") : require("react-dom/server");
/**
 * Flight Response is always set to application/octet-stream to ensure it does not
 */ class FlightRenderResult extends _renderResult.default {
    constructor(response){
        super(response, {
            contentType: "application/octet-stream"
        });
    }
}
/**
 * Interop between "export default" and "module.exports".
 */ function interopDefault(mod) {
    return mod.default || mod;
}
// tolerate dynamic server errors during prerendering so console
// isn't spammed with unactionable errors
function onError(err) {
    const { DynamicServerError  } = require("../client/components/hooks-server-context");
    if (!(err instanceof DynamicServerError)) {
        console.error(err);
    }
}
let isFetchPatched = false;
// we patch fetch to collect cache information used for
// determining if a page is static or not
function patchFetch() {
    if (isFetchPatched) return;
    isFetchPatched = true;
    const { DynamicServerError  } = require("../client/components/hooks-server-context");
    const { useTrackStaticGeneration  } = require("../client/components/hooks-server");
    const origFetch = global.fetch;
    global.fetch = async (init, opts)=>{
        let staticGenerationContext = {};
        try {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            staticGenerationContext = useTrackStaticGeneration() || {};
        } catch (_) {}
        const { isStaticGeneration , fetchRevalidate , pathname  } = staticGenerationContext;
        if (isStaticGeneration) {
            if (opts && typeof opts === "object") {
                if (opts.cache === "no-store") {
                    staticGenerationContext.revalidate = 0;
                    // TODO: ensure this error isn't logged to the user
                    // seems it's slipping through currently
                    throw new DynamicServerError(`no-store fetch ${init}${pathname ? ` ${pathname}` : ""}`);
                }
                if (typeof opts.revalidate === "number" && (typeof fetchRevalidate === "undefined" || opts.revalidate < fetchRevalidate)) {
                    staticGenerationContext.fetchRevalidate = opts.revalidate;
                }
            }
        }
        return origFetch(init, opts);
    };
}
/**
 * Render Flight stream.
 * This is only used for renderToHTML, the Flight response does not need additional wrappers.
 */ function useFlightResponse(writable, req, serverComponentManifest, rscChunks, flightResponseRef, nonce) {
    if (flightResponseRef.current !== null) {
        return flightResponseRef.current;
    }
    const [renderStream, forwardStream] = (0, _nodeWebStreamsHelper).readableStreamTee(req);
    const res = (0, _reactServerDomWebpack).createFromReadableStream(renderStream, {
        moduleMap: serverComponentManifest.__ssr_module_mapping__
    });
    flightResponseRef.current = res;
    let bootstrapped = false;
    // We only attach CSS chunks to the inlined data.
    const forwardReader = forwardStream.getReader();
    const writer = writable.getWriter();
    const startScriptTag = nonce ? `<script nonce=${JSON.stringify(nonce)}>` : "<script>";
    function process() {
        forwardReader.read().then(({ done , value  })=>{
            if (value) {
                rscChunks.push(value);
            }
            if (!bootstrapped) {
                bootstrapped = true;
                writer.write((0, _nodeWebStreamsHelper).encodeText(`${startScriptTag}(self.__next_s=self.__next_s||[]).push(${(0, _htmlescape).htmlEscapeJsonString(JSON.stringify([
                    0
                ]))})</script>`));
            }
            if (done) {
                flightResponseRef.current = null;
                writer.close();
            } else {
                const responsePartial = (0, _nodeWebStreamsHelper).decodeText(value);
                const scripts = `${startScriptTag}(self.__next_s=self.__next_s||[]).push(${(0, _htmlescape).htmlEscapeJsonString(JSON.stringify([
                    1,
                    responsePartial
                ]))})</script>`;
                writer.write((0, _nodeWebStreamsHelper).encodeText(scripts));
                process();
            }
        });
    }
    process();
    return res;
}
/**
 * Create a component that renders the Flight stream.
 * This is only used for renderToHTML, the Flight response does not need additional wrappers.
 */ function createServerComponentRenderer(ComponentToRender, ComponentMod, { transformStream , serverComponentManifest , serverContexts , rscChunks  }, nonce) {
    // We need to expose the `__webpack_require__` API globally for
    // react-server-dom-webpack. This is a hack until we find a better way.
    if (ComponentMod.__next_app_webpack_require__ || ComponentMod.__next_rsc__) {
        var ref;
        // @ts-ignore
        globalThis.__next_require__ = ComponentMod.__next_app_webpack_require__ || ((ref = ComponentMod.__next_rsc__) == null ? void 0 : ref.__webpack_require__);
        // @ts-ignore
        globalThis.__next_chunk_load__ = ()=>Promise.resolve();
    }
    let RSCStream;
    const createRSCStream = ()=>{
        if (!RSCStream) {
            RSCStream = (0, _writerBrowserServer).renderToReadableStream(/*#__PURE__*/ _react.default.createElement(ComponentToRender, null), serverComponentManifest, {
                context: serverContexts,
                onError
            });
        }
        return RSCStream;
    };
    const flightResponseRef = {
        current: null
    };
    const writable = transformStream.writable;
    return function ServerComponentWrapper() {
        const reqStream = createRSCStream();
        const response = useFlightResponse(writable, reqStream, serverComponentManifest, rscChunks, flightResponseRef, nonce);
        return (0, _react).experimental_use(response);
    };
}
/**
 * Shorten the dynamic param in order to make it smaller when transmitted to the browser.
 */ function getShortDynamicParamType(type) {
    switch(type){
        case "catchall":
            return "c";
        case "optional-catchall":
            return "oc";
        case "dynamic":
            return "d";
        default:
            throw new Error("Unknown dynamic param type");
    }
}
/**
 * Parse dynamic route segment to type of parameter
 */ function getSegmentParam(segment) {
    if (segment.startsWith("[[...") && segment.endsWith("]]")) {
        return {
            type: "optional-catchall",
            param: segment.slice(5, -2)
        };
    }
    if (segment.startsWith("[...") && segment.endsWith("]")) {
        return {
            type: "catchall",
            param: segment.slice(4, -1)
        };
    }
    if (segment.startsWith("[") && segment.endsWith("]")) {
        return {
            type: "dynamic",
            param: segment.slice(1, -1)
        };
    }
    return null;
}
/**
 * Get inline <link> tags based on server CSS manifest. Only used when rendering to HTML.
 */ function getCssInlinedLinkTags(serverComponentManifest, serverCSSManifest, filePath) {
    var ref;
    const layoutOrPageCss = serverCSSManifest[filePath] || ((ref = serverComponentManifest.__client_css_manifest__) == null ? void 0 : ref[filePath]);
    if (!layoutOrPageCss) {
        return [];
    }
    const chunks = new Set();
    for (const css of layoutOrPageCss){
        const mod = serverComponentManifest[css];
        if (mod) {
            for (const chunk of mod.default.chunks){
                chunks.add(chunk);
            }
        }
    }
    return [
        ...chunks
    ];
}
function getScriptNonceFromHeader(cspHeaderValue) {
    var ref;
    const directives = cspHeaderValue// Directives are split by ';'.
    .split(";").map((directive)=>directive.trim());
    // First try to find the directive for the 'script-src', otherwise try to
    // fallback to the 'default-src'.
    const directive1 = directives.find((dir)=>dir.startsWith("script-src")) || directives.find((dir)=>dir.startsWith("default-src"));
    // If no directive could be found, then we're done.
    if (!directive1) {
        return;
    }
    // Extract the nonce from the directive
    const nonce = (ref = directive1.split(" ")// Remove the 'strict-src'/'default-src' string, this can't be the nonce.
    .slice(1).map((source)=>source.trim())// Find the first source with the 'nonce-' prefix.
    .find((source)=>source.startsWith("'nonce-") && source.length > 8 && source.endsWith("'"))) == null ? void 0 : ref.slice(7, -1);
    // If we could't find the nonce, then we're done.
    if (!nonce) {
        return;
    }
    // Don't accept the nonce value if it contains HTML escape characters.
    // Technically, the spec requires a base64'd value, but this is just an
    // extra layer.
    if (_htmlescape.ESCAPE_REGEX.test(nonce)) {
        throw new Error("Nonce value from Content-Security-Policy contained HTML escape characters.\nLearn more: https://nextjs.org/docs/messages/nonce-contained-invalid-characters");
    }
    return nonce;
}
async function renderToHTMLOrFlight(req, res, pathname, query, renderOpts, isPagesDir, isStaticGeneration = false) {
    patchFetch();
    const { CONTEXT_NAMES  } = require("../client/components/hooks-server-context");
    // @ts-expect-error createServerContext exists in react@experimental + react-dom@experimental
    if (typeof _react.default.createServerContext === "undefined") {
        throw new Error('"app" directory requires React.createServerContext which is not available in the version of React you are using. Please update to react@experimental and react-dom@experimental.');
    }
    // don't modify original query object
    query = Object.assign({}, query);
    const { buildManifest , subresourceIntegrityManifest , serverComponentManifest , serverCSSManifest ={} , supportsDynamicHTML , ComponentMod ,  } = renderOpts;
    const isFlight = query.__flight__ !== undefined;
    const isPrefetch = query.__flight_prefetch__ !== undefined;
    // Handle client-side navigation to pages directory
    if (isFlight && isPagesDir) {
        (0, _internalUtils).stripInternalQueries(query);
        const search = (0, _querystring).stringify(query);
        // Empty so that the client-side router will do a full page navigation.
        const flightData = pathname + (search ? `?${search}` : "");
        return new FlightRenderResult((0, _writerBrowserServer).renderToReadableStream(flightData, serverComponentManifest, {
            onError
        }).pipeThrough((0, _nodeWebStreamsHelper).createBufferedTransformStream()));
    }
    // TODO-APP: verify the tree is valid
    // TODO-APP: verify query param is single value (not an array)
    // TODO-APP: verify tree can't grow out of control
    /**
   * Router state provided from the client-side router. Used to handle rendering from the common layout down.
   */ const providedFlightRouterState = isFlight ? query.__flight_router_state_tree__ ? JSON.parse(query.__flight_router_state_tree__) : {} : undefined;
    (0, _internalUtils).stripInternalQueries(query);
    const LayoutRouter = ComponentMod.LayoutRouter;
    const RenderFromTemplateContext = ComponentMod.RenderFromTemplateContext;
    const HotReloader = ComponentMod.HotReloader;
    const headers = req.headers;
    // TODO-APP: fix type of req
    // @ts-expect-error
    const cookies = req.cookies;
    /**
   * The tree created in next-app-loader that holds component segments and modules
   */ const loaderTree = ComponentMod.tree;
    const tryGetPreviewData = process.env.NEXT_RUNTIME === "edge" ? ()=>false : require("./api-utils/node").tryGetPreviewData;
    // Reads of this are cached on the `req` object, so this should resolve
    // instantly. There's no need to pass this data down from a previous
    // invoke, where we'd have to consider server & serverless.
    const previewData = tryGetPreviewData(req, res, renderOpts.previewProps);
    /**
   * Server Context is specifically only available in Server Components.
   * It has to hold values that can't change while rendering from the common layout down.
   * An example of this would be that `headers` are available but `searchParams` are not because that'd mean we have to render from the root layout down on all requests.
   */ const staticGenerationContext = {
        isStaticGeneration,
        pathname
    };
    const serverContexts = [
        [
            "WORKAROUND",
            null
        ],
        [
            CONTEXT_NAMES.HeadersContext,
            headers
        ],
        [
            CONTEXT_NAMES.CookiesContext,
            cookies
        ],
        [
            CONTEXT_NAMES.PreviewDataContext,
            previewData
        ],
        [
            CONTEXT_NAMES.StaticGenerationContext,
            staticGenerationContext
        ], 
    ];
    /**
   * Dynamic parameters. E.g. when you visit `/dashboard/vercel` which is rendered by `/dashboard/[slug]` the value will be {"slug": "vercel"}.
   */ const pathParams = renderOpts.params;
    /**
   * Parse the dynamic segment and return the associated value.
   */ const getDynamicParamFromSegment = (// [slug] / [[slug]] / [...slug]
    segment)=>{
        const segmentParam = getSegmentParam(segment);
        if (!segmentParam) {
            return null;
        }
        const key = segmentParam.param;
        const value = pathParams[key];
        if (!value) {
            // Handle case where optional catchall does not have a value, e.g. `/dashboard/[...slug]` when requesting `/dashboard`
            if (segmentParam.type === "optional-catchall") {
                const type = getShortDynamicParamType(segmentParam.type);
                return {
                    param: key,
                    value: null,
                    type: type,
                    // This value always has to be a string.
                    treeSegment: [
                        key,
                        "",
                        type
                    ]
                };
            }
            return null;
        }
        const type = getShortDynamicParamType(segmentParam.type);
        return {
            param: key,
            // The value that is passed to user code.
            value: value,
            // The value that is rendered in the router tree.
            treeSegment: [
                key,
                Array.isArray(value) ? value.join("/") : value,
                type
            ],
            type: type
        };
    };
    const createFlightRouterStateFromLoaderTree = ([segment, parallelRoutes])=>{
        const dynamicParam = getDynamicParamFromSegment(segment);
        const segmentTree = [
            dynamicParam ? dynamicParam.treeSegment : segment,
            {}, 
        ];
        if (parallelRoutes) {
            segmentTree[1] = Object.keys(parallelRoutes).reduce((existingValue, currentValue)=>{
                existingValue[currentValue] = createFlightRouterStateFromLoaderTree(parallelRoutes[currentValue]);
                return existingValue;
            }, {});
        }
        return segmentTree;
    };
    let defaultRevalidate = false;
    /**
   * Use the provided loader tree to create the React Component tree.
   */ const createComponentTree = async ({ createSegmentPath , loaderTree: [segment, parallelRoutes, { layoutOrPagePath , layout , template , error , loading , page  }, ] , parentParams , firstItem , rootLayoutIncluded  })=>{
        // TODO-APP: enable stylesheet per layout/page
        const stylesheets = layoutOrPagePath ? getCssInlinedLinkTags(serverComponentManifest, serverCSSManifest, layoutOrPagePath) : [];
        const Template = template ? await interopDefault(template()) : _react.default.Fragment;
        const ErrorComponent = error ? await interopDefault(error()) : undefined;
        const Loading = loading ? await interopDefault(loading()) : undefined;
        const isLayout = typeof layout !== "undefined";
        const isPage = typeof page !== "undefined";
        const layoutOrPageMod = isLayout ? await layout() : isPage ? await page() : undefined;
        if (layoutOrPageMod == null ? void 0 : layoutOrPageMod.config) {
            defaultRevalidate = layoutOrPageMod.config.revalidate;
        }
        /**
     * Checks if the current segment is a root layout.
     */ const rootLayoutAtThisLevel = isLayout && !rootLayoutIncluded;
        /**
     * Checks if the current segment or any level above it has a root layout.
     */ const rootLayoutIncludedAtThisLevelOrAbove = rootLayoutIncluded || rootLayoutAtThisLevel;
        // TODO-APP: move these errors to the loader instead?
        // we will also need a migration doc here to link to
        if (typeof (layoutOrPageMod == null ? void 0 : layoutOrPageMod.getServerSideProps) === "function") {
            throw new Error(`getServerSideProps is not supported in app/, detected in ${segment}`);
        }
        if (typeof (layoutOrPageMod == null ? void 0 : layoutOrPageMod.getStaticProps) === "function") {
            throw new Error(`getStaticProps is not supported in app/, detected in ${segment}`);
        }
        /**
     * The React Component to render.
     */ const Component = layoutOrPageMod ? interopDefault(layoutOrPageMod) : undefined;
        // Handle dynamic segment params.
        const segmentParam = getDynamicParamFromSegment(segment);
        /**
     * Create object holding the parent params and current params
     */ const currentParams = // Handle null case where dynamic param is optional
        segmentParam && segmentParam.value !== null ? {
            ...parentParams,
            [segmentParam.param]: segmentParam.value
        } : parentParams;
        // Resolve the segment param
        const actualSegment = segmentParam ? segmentParam.treeSegment : segment;
        // This happens outside of rendering in order to eagerly kick off data fetching for layouts / the page further down
        const parallelRouteMap = await Promise.all(Object.keys(parallelRoutes).map(async (parallelRouteKey)=>{
            const currentSegmentPath = firstItem ? [
                parallelRouteKey
            ] : [
                actualSegment,
                parallelRouteKey
            ];
            const childSegment = parallelRoutes[parallelRouteKey][0];
            const childSegmentParam = getDynamicParamFromSegment(childSegment);
            if (isPrefetch && Loading) {
                const childProp = {
                    // Null indicates the tree is not fully rendered
                    current: null,
                    segment: childSegmentParam ? childSegmentParam.treeSegment : childSegment
                };
                // This is turned back into an object below.
                return [
                    parallelRouteKey,
                    /*#__PURE__*/ _react.default.createElement(LayoutRouter, {
                        parallelRouterKey: parallelRouteKey,
                        segmentPath: createSegmentPath(currentSegmentPath),
                        loading: Loading ? /*#__PURE__*/ _react.default.createElement(Loading, null) : undefined,
                        error: ErrorComponent,
                        template: /*#__PURE__*/ _react.default.createElement(Template, null, /*#__PURE__*/ _react.default.createElement(RenderFromTemplateContext, null)),
                        childProp: childProp,
                        rootLayoutIncluded: rootLayoutIncludedAtThisLevelOrAbove
                    }), 
                ];
            }
            // Create the child component
            const { Component: ChildComponent  } = await createComponentTree({
                createSegmentPath: (child)=>{
                    return createSegmentPath([
                        ...currentSegmentPath,
                        ...child
                    ]);
                },
                loaderTree: parallelRoutes[parallelRouteKey],
                parentParams: currentParams,
                rootLayoutIncluded: rootLayoutIncludedAtThisLevelOrAbove
            });
            const childProp = {
                current: /*#__PURE__*/ _react.default.createElement(ChildComponent, null),
                segment: childSegmentParam ? childSegmentParam.treeSegment : childSegment
            };
            const segmentPath = createSegmentPath(currentSegmentPath);
            // This is turned back into an object below.
            return [
                parallelRouteKey,
                /*#__PURE__*/ _react.default.createElement(LayoutRouter, {
                    parallelRouterKey: parallelRouteKey,
                    segmentPath: segmentPath,
                    error: ErrorComponent,
                    loading: Loading ? /*#__PURE__*/ _react.default.createElement(Loading, null) : undefined,
                    template: /*#__PURE__*/ _react.default.createElement(Template, null, /*#__PURE__*/ _react.default.createElement(RenderFromTemplateContext, null)),
                    childProp: childProp,
                    rootLayoutIncluded: rootLayoutIncludedAtThisLevelOrAbove
                }), 
            ];
        }));
        // Convert the parallel route map into an object after all promises have been resolved.
        const parallelRouteComponents = parallelRouteMap.reduce((list, [parallelRouteKey, Comp])=>{
            list[parallelRouteKey] = Comp;
            return list;
        }, {});
        // When the segment does not have a layout or page we still have to add the layout router to ensure the path holds the loading component
        if (!Component) {
            return {
                Component: ()=>/*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, parallelRouteComponents.children)
            };
        }
        return {
            Component: ()=>{
                let props = {};
                return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, stylesheets ? stylesheets.map((href)=>/*#__PURE__*/ _react.default.createElement("link", {
                        rel: "stylesheet",
                        href: `/_next/${href}?ts=${Date.now()}`,
                        // `Precedence` is an opt-in signal for React to handle
                        // resource loading and deduplication, etc:
                        // https://github.com/facebook/react/pull/25060
                        // @ts-ignore
                        precedence: "high",
                        key: href
                    })) : null, /*#__PURE__*/ _react.default.createElement(Component, Object.assign({}, props, parallelRouteComponents, {
                    // TODO-APP: params and query have to be blocked parallel route names. Might have to add a reserved name list.
                    // Params are always the current params that apply to the layout
                    // If you have a `/dashboard/[team]/layout.js` it will provide `team` as a param but not anything further down.
                    params: currentParams
                }, isPage ? {
                    searchParams: query
                } : {})));
            }
        };
    };
    /**
   * Rules of Static & Dynamic HTML:
   *
   *    1.) We must generate static HTML unless the caller explicitly opts
   *        in to dynamic HTML support.
   *
   *    2.) If dynamic HTML support is requested, we must honor that request
   *        or throw an error. It is the sole responsibility of the caller to
   *        ensure they aren't e.g. requesting dynamic HTML for an AMP page.
   *
   * These rules help ensure that other existing features like request caching,
   * coalescing, and ISR continue working as intended.
   */ const generateStaticHTML = supportsDynamicHTML !== true;
    // Handle Flight render request. This is only used when client-side navigating. E.g. when you `router.push('/dashboard')` or `router.reload()`.
    if (isFlight) {
        // TODO-APP: throw on invalid flightRouterState
        /**
     * Use router state to decide at what common layout to render the page.
     * This can either be the common layout between two pages or a specific place to start rendering from using the "refetch" marker in the tree.
     */ const walkTreeWithFlightRouterState = async (loaderTreeToFilter, parentParams, flightRouterState, parentRendered)=>{
            const [segment, parallelRoutes] = loaderTreeToFilter;
            const parallelRoutesKeys = Object.keys(parallelRoutes);
            // Because this function walks to a deeper point in the tree to start rendering we have to track the dynamic parameters up to the point where rendering starts
            const segmentParam = getDynamicParamFromSegment(segment);
            const currentParams = // Handle null case where dynamic param is optional
            segmentParam && segmentParam.value !== null ? {
                ...parentParams,
                [segmentParam.param]: segmentParam.value
            } : parentParams;
            const actualSegment = segmentParam ? segmentParam.treeSegment : segment;
            /**
       * Decide if the current segment is where rendering has to start.
       */ const renderComponentsOnThisLevel = // No further router state available
            !flightRouterState || // Segment in router state does not match current segment
            !(0, _matchSegments).matchSegment(actualSegment, flightRouterState[0]) || // Last item in the tree
            parallelRoutesKeys.length === 0 || // Explicit refresh
            flightRouterState[3] === "refetch";
            if (!parentRendered && renderComponentsOnThisLevel) {
                return [
                    actualSegment,
                    // Create router state using the slice of the loaderTree
                    createFlightRouterStateFromLoaderTree(loaderTreeToFilter),
                    // Check if one level down from the common layout has a loading component. If it doesn't only provide the router state as part of the Flight data.
                    isPrefetch && !Boolean(loaderTreeToFilter[2].loading) ? null : /*#__PURE__*/ _react.default.createElement((await createComponentTree(// This ensures flightRouterPath is valid and filters down the tree
                    {
                        createSegmentPath: (child)=>child,
                        loaderTree: loaderTreeToFilter,
                        parentParams: currentParams,
                        firstItem: true
                    })).Component), 
                ];
            }
            // Walk through all parallel routes.
            for (const parallelRouteKey of parallelRoutesKeys){
                const parallelRoute = parallelRoutes[parallelRouteKey];
                const path = await walkTreeWithFlightRouterState(parallelRoute, currentParams, flightRouterState && flightRouterState[1][parallelRouteKey], parentRendered || renderComponentsOnThisLevel);
                if (typeof path[path.length - 1] !== "string") {
                    return [
                        actualSegment,
                        parallelRouteKey,
                        ...path
                    ];
                }
            }
            return [
                actualSegment
            ];
        };
        // Flight data that is going to be passed to the browser.
        // Currently a single item array but in the future multiple patches might be combined in a single request.
        const flightData = [
            // TODO-APP: change walk to output without ''
            (await walkTreeWithFlightRouterState(loaderTree, {}, providedFlightRouterState)).slice(1), 
        ];
        const readable = (0, _writerBrowserServer).renderToReadableStream(flightData, serverComponentManifest, {
            context: serverContexts,
            onError
        }).pipeThrough((0, _nodeWebStreamsHelper).createBufferedTransformStream());
        if (generateStaticHTML) {
            let staticHtml = Buffer.from((await readable.getReader().read()).value || "").toString();
            return new FlightRenderResult(staticHtml);
        }
        return new FlightRenderResult(readable);
    }
    // Below this line is handling for rendering to HTML.
    // Create full component tree from root to leaf.
    const { Component: ComponentTree  } = await createComponentTree({
        createSegmentPath: (child)=>child,
        loaderTree: loaderTree,
        parentParams: {},
        firstItem: true
    });
    // AppRouter is provided by next-app-loader
    const AppRouter = ComponentMod.AppRouter;
    let serverComponentsInlinedTransformStream = new TransformStream();
    // TODO-APP: validate req.url as it gets passed to render.
    const initialCanonicalUrl = req.url;
    // Get the nonce from the incomming request if it has one.
    const csp = req.headers["content-security-policy"];
    let nonce;
    if (csp && typeof csp === "string") {
        nonce = getScriptNonceFromHeader(csp);
    }
    const serverComponentsRenderOpts = {
        transformStream: serverComponentsInlinedTransformStream,
        serverComponentManifest,
        serverContexts,
        rscChunks: []
    };
    /**
   * A new React Component that renders the provided React Component
   * using Flight which can then be rendered to HTML.
   */ const ServerComponentsRenderer = createServerComponentRenderer(()=>{
        const initialTree = createFlightRouterStateFromLoaderTree(loaderTree);
        return /*#__PURE__*/ _react.default.createElement(AppRouter, {
            hotReloader: HotReloader && /*#__PURE__*/ _react.default.createElement(HotReloader, {
                assetPrefix: renderOpts.assetPrefix || ""
            }),
            initialCanonicalUrl: initialCanonicalUrl,
            initialTree: initialTree
        }, /*#__PURE__*/ _react.default.createElement(ComponentTree, null));
    }, ComponentMod, serverComponentsRenderOpts, nonce);
    const flushEffectsCallbacks = new Set();
    function FlushEffects({ children  }) {
        // Reset flushEffectsHandler on each render
        flushEffectsCallbacks.clear();
        const addFlushEffects = _react.default.useCallback((handler)=>{
            flushEffectsCallbacks.add(handler);
        }, []);
        return /*#__PURE__*/ _react.default.createElement(_flushEffects.FlushEffectsContext.Provider, {
            value: addFlushEffects
        }, children);
    }
    const bodyResult = async ()=>{
        const content = /*#__PURE__*/ _react.default.createElement(FlushEffects, null, /*#__PURE__*/ _react.default.createElement(ServerComponentsRenderer, null));
        const flushEffectHandler = ()=>{
            const flushed = ReactDOMServer.renderToString(/*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, Array.from(flushEffectsCallbacks).map((callback)=>callback())));
            return flushed;
        };
        try {
            const renderStream = await (0, _nodeWebStreamsHelper).renderToInitialStream({
                ReactDOMServer,
                element: content,
                streamOptions: {
                    nonce,
                    // Include hydration scripts in the HTML
                    bootstrapScripts: subresourceIntegrityManifest ? buildManifest.rootMainFiles.map((src)=>({
                            src: `${renderOpts.assetPrefix || ""}/_next/` + src,
                            integrity: subresourceIntegrityManifest[src]
                        })) : buildManifest.rootMainFiles.map((src)=>`${renderOpts.assetPrefix || ""}/_next/` + src)
                }
            });
            return await (0, _nodeWebStreamsHelper).continueFromInitialStream(renderStream, {
                dataStream: serverComponentsInlinedTransformStream == null ? void 0 : serverComponentsInlinedTransformStream.readable,
                generateStaticHTML: generateStaticHTML,
                flushEffectHandler,
                flushEffectsToHead: true
            });
        } catch (err) {
            // TODO-APP: show error overlay in development. `element` should probably be wrapped in AppRouter for this case.
            const renderStream = await (0, _nodeWebStreamsHelper).renderToInitialStream({
                ReactDOMServer,
                element: /*#__PURE__*/ _react.default.createElement("html", {
                    id: "__next_error__"
                }, /*#__PURE__*/ _react.default.createElement("head", null), /*#__PURE__*/ _react.default.createElement("body", null)),
                streamOptions: {
                    nonce,
                    // Include hydration scripts in the HTML
                    bootstrapScripts: subresourceIntegrityManifest ? buildManifest.rootMainFiles.map((src)=>({
                            src: `${renderOpts.assetPrefix || ""}/_next/` + src,
                            integrity: subresourceIntegrityManifest[src]
                        })) : buildManifest.rootMainFiles.map((src)=>`${renderOpts.assetPrefix || ""}/_next/` + src)
                }
            });
            return await (0, _nodeWebStreamsHelper).continueFromInitialStream(renderStream, {
                dataStream: serverComponentsInlinedTransformStream == null ? void 0 : serverComponentsInlinedTransformStream.readable,
                generateStaticHTML: generateStaticHTML,
                flushEffectHandler,
                flushEffectsToHead: true
            });
        }
    };
    const readable = await bodyResult();
    if (generateStaticHTML) {
        let staticHtml = Buffer.from((await readable.getReader().read()).value || "").toString();
        renderOpts.pageData = Buffer.concat(serverComponentsRenderOpts.rscChunks).toString();
        renderOpts.revalidate = typeof staticGenerationContext.revalidate === "undefined" ? defaultRevalidate : staticGenerationContext.revalidate;
        return new _renderResult.default(staticHtml);
    }
    return new _renderResult.default(readable);
}

//# sourceMappingURL=app-render.js.map