"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderToHTML = renderToHTML;
var _react = _interopRequireDefault(require("react"));
var _styledJsx = require("styled-jsx");
var _constants = require("../lib/constants");
var _constants1 = require("../shared/lib/constants");
var _isSerializableProps = require("../lib/is-serializable-props");
var _ampMode = require("../shared/lib/amp-mode");
var _ampContext = require("../shared/lib/amp-context");
var _head = require("../shared/lib/head");
var _headManagerContext = require("../shared/lib/head-manager-context");
var _loadable = _interopRequireDefault(require("../shared/lib/loadable"));
var _loadableContext = require("../shared/lib/loadable-context");
var _routerContext = require("../shared/lib/router-context");
var _isDynamic = require("../shared/lib/router/utils/is-dynamic");
var _utils = require("../shared/lib/utils");
var _htmlContext = require("../shared/lib/html-context");
var _normalizePagePath = require("../shared/lib/page-path/normalize-page-path");
var _denormalizePagePath = require("../shared/lib/page-path/denormalize-page-path");
var _requestMeta = require("./request-meta");
var _redirectStatus = require("../lib/redirect-status");
var _renderResult = _interopRequireDefault(require("./render-result"));
var _isError = _interopRequireDefault(require("../lib/is-error"));
var _nodeWebStreamsHelper = require("./node-web-streams-helper");
var _imageConfigContext = require("../shared/lib/image-config-context");
var _stripAnsi = _interopRequireDefault(require("next/dist/compiled/strip-ansi"));
var _utils1 = require("./utils");
var _internalUtils = require("./internal-utils");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
let tryGetPreviewData;
let warn;
let postProcessHTML;
const DOCTYPE = "<!DOCTYPE html>";
const ReactDOMServer = _utils1.shouldUseReactRoot ? require("react-dom/server.browser") : require("react-dom/server");
if (process.env.NEXT_RUNTIME !== "edge") {
    require("./node-polyfill-web-streams");
    tryGetPreviewData = require("./api-utils/node").tryGetPreviewData;
    warn = require("../build/output/log").warn;
    postProcessHTML = require("./post-process").postProcessHTML;
} else {
    warn = console.warn.bind(console);
    postProcessHTML = async (_pathname, html)=>html;
}
function noRouter() {
    const message = 'No router instance found. you should only use "next/router" inside the client side of your app. https://nextjs.org/docs/messages/no-router-instance';
    throw new Error(message);
}
class ServerRouter {
    constructor(pathname, query, as, { isFallback  }, isReady, basePath, locale, locales, defaultLocale, domainLocales, isPreview, isLocaleDomain){
        this.route = pathname.replace(/\/$/, "") || "/";
        this.pathname = pathname;
        this.query = query;
        this.asPath = as;
        this.isFallback = isFallback;
        this.basePath = basePath;
        this.locale = locale;
        this.locales = locales;
        this.defaultLocale = defaultLocale;
        this.isReady = isReady;
        this.domainLocales = domainLocales;
        this.isPreview = !!isPreview;
        this.isLocaleDomain = !!isLocaleDomain;
    }
    push() {
        noRouter();
    }
    replace() {
        noRouter();
    }
    reload() {
        noRouter();
    }
    back() {
        noRouter();
    }
    prefetch() {
        noRouter();
    }
    beforePopState() {
        noRouter();
    }
}
function enhanceComponents(options, App, Component) {
    // For backwards compatibility
    if (typeof options === "function") {
        return {
            App,
            Component: options(Component)
        };
    }
    return {
        App: options.enhanceApp ? options.enhanceApp(App) : App,
        Component: options.enhanceComponent ? options.enhanceComponent(Component) : Component
    };
}
function renderPageTree(App, Component, props) {
    return /*#__PURE__*/ _react.default.createElement(App, Object.assign({
        Component: Component
    }, props));
}
const invalidKeysMsg = (methodName, invalidKeys)=>{
    const docsPathname = `invalid-${methodName.toLocaleLowerCase()}-value`;
    return `Additional keys were returned from \`${methodName}\`. Properties intended for your component must be nested under the \`props\` key, e.g.:` + `\n\n\treturn { props: { title: 'My Title', content: '...' } }` + `\n\nKeys that need to be moved: ${invalidKeys.join(", ")}.` + `\nRead more: https://nextjs.org/docs/messages/${docsPathname}`;
};
function checkRedirectValues(redirect, req, method) {
    const { destination , permanent , statusCode , basePath  } = redirect;
    let errors = [];
    const hasStatusCode = typeof statusCode !== "undefined";
    const hasPermanent = typeof permanent !== "undefined";
    if (hasPermanent && hasStatusCode) {
        errors.push(`\`permanent\` and \`statusCode\` can not both be provided`);
    } else if (hasPermanent && typeof permanent !== "boolean") {
        errors.push(`\`permanent\` must be \`true\` or \`false\``);
    } else if (hasStatusCode && !_redirectStatus.allowedStatusCodes.has(statusCode)) {
        errors.push(`\`statusCode\` must undefined or one of ${[
            ..._redirectStatus.allowedStatusCodes
        ].join(", ")}`);
    }
    const destinationType = typeof destination;
    if (destinationType !== "string") {
        errors.push(`\`destination\` should be string but received ${destinationType}`);
    }
    const basePathType = typeof basePath;
    if (basePathType !== "undefined" && basePathType !== "boolean") {
        errors.push(`\`basePath\` should be undefined or a false, received ${basePathType}`);
    }
    if (errors.length > 0) {
        throw new Error(`Invalid redirect object returned from ${method} for ${req.url}\n` + errors.join(" and ") + "\n" + `See more info here: https://nextjs.org/docs/messages/invalid-redirect-gssp`);
    }
}
function errorToJSON(err) {
    let source = "server";
    if (process.env.NEXT_RUNTIME !== "edge") {
        source = require("next/dist/compiled/@next/react-dev-overlay/dist/middleware").getErrorSource(err) || "server";
    }
    return {
        name: err.name,
        source,
        message: (0, _stripAnsi).default(err.message),
        stack: err.stack
    };
}
function serializeError(dev, err) {
    if (dev) {
        return errorToJSON(err);
    }
    return {
        name: "Internal Server Error.",
        message: "500 - Internal Server Error.",
        statusCode: 500
    };
}
async function renderToHTML(req, res, pathname, query, renderOpts) {
    var ref, ref1;
    // In dev we invalidate the cache by appending a timestamp to the resource URL.
    // This is a workaround to fix https://github.com/vercel/next.js/issues/5860
    // TODO: remove this workaround when https://bugs.webkit.org/show_bug.cgi?id=187726 is fixed.
    renderOpts.devOnlyCacheBusterQueryString = renderOpts.dev ? renderOpts.devOnlyCacheBusterQueryString || `?ts=${Date.now()}` : "";
    // don't modify original query object
    query = Object.assign({}, query);
    const { err , dev =false , ampPath ="" , pageConfig ={} , buildManifest , reactLoadableManifest , ErrorDebug , getStaticProps , getStaticPaths , getServerSideProps , isDataReq , params , previewProps , basePath , devOnlyCacheBusterQueryString , supportsDynamicHTML , images , runtime: globalRuntime , App ,  } = renderOpts;
    let Document = renderOpts.Document;
    // Component will be wrapped by ServerComponentWrapper for RSC
    let Component = renderOpts.Component;
    const OriginComponent = Component;
    let serverComponentsInlinedTransformStream = null;
    const isFallback = !!query.__nextFallback;
    const notFoundSrcPage = query.__nextNotFoundSrcPage;
    // next internal queries should be stripped out
    (0, _internalUtils).stripInternalQueries(query);
    const callMiddleware = async (method, args, props = false)=>{
        let results = props ? {} : [];
        if (Document[`${method}Middleware`]) {
            let middlewareFunc = await Document[`${method}Middleware`];
            middlewareFunc = middlewareFunc.default || middlewareFunc;
            const curResults = await middlewareFunc(...args);
            if (props) {
                for (const result of curResults){
                    results = {
                        ...results,
                        ...result
                    };
                }
            } else {
                results = curResults;
            }
        }
        return results;
    };
    const headTags = (...args)=>callMiddleware("headTags", args);
    const isSSG = !!getStaticProps;
    const isBuildTimeSSG = isSSG && renderOpts.nextExport;
    const defaultAppGetInitialProps = App.getInitialProps === App.origGetInitialProps;
    const hasPageGetInitialProps = !!((ref = Component) == null ? void 0 : ref.getInitialProps);
    const hasPageScripts = (ref1 = Component) == null ? void 0 : ref1.unstable_scriptLoader;
    const pageIsDynamic = (0, _isDynamic).isDynamicRoute(pathname);
    const defaultErrorGetInitialProps = pathname === "/_error" && Component.getInitialProps === Component.origGetInitialProps;
    if (renderOpts.nextExport && hasPageGetInitialProps && !defaultErrorGetInitialProps) {
        warn(`Detected getInitialProps on page '${pathname}'` + `while running "next export". It's recommended to use getStaticProps` + `which has a more correct behavior for static exporting.` + `\nRead more: https://nextjs.org/docs/messages/get-initial-props-export`);
    }
    const isAutoExport = !hasPageGetInitialProps && defaultAppGetInitialProps && !isSSG && !getServerSideProps;
    if (hasPageGetInitialProps && isSSG) {
        throw new Error(_constants.SSG_GET_INITIAL_PROPS_CONFLICT + ` ${pathname}`);
    }
    if (hasPageGetInitialProps && getServerSideProps) {
        throw new Error(_constants.SERVER_PROPS_GET_INIT_PROPS_CONFLICT + ` ${pathname}`);
    }
    if (getServerSideProps && isSSG) {
        throw new Error(_constants.SERVER_PROPS_SSG_CONFLICT + ` ${pathname}`);
    }
    if (getStaticPaths && !pageIsDynamic) {
        throw new Error(`getStaticPaths is only allowed for dynamic SSG pages and was found on '${pathname}'.` + `\nRead more: https://nextjs.org/docs/messages/non-dynamic-getstaticpaths-usage`);
    }
    if (!!getStaticPaths && !isSSG) {
        throw new Error(`getStaticPaths was added without a getStaticProps in ${pathname}. Without getStaticProps, getStaticPaths does nothing`);
    }
    if (isSSG && pageIsDynamic && !getStaticPaths) {
        throw new Error(`getStaticPaths is required for dynamic SSG pages and is missing for '${pathname}'.` + `\nRead more: https://nextjs.org/docs/messages/invalid-getstaticpaths-value`);
    }
    let asPath = renderOpts.resolvedAsPath || req.url;
    if (dev) {
        const { isValidElementType  } = require("next/dist/compiled/react-is");
        if (!isValidElementType(Component)) {
            throw new Error(`The default export is not a React Component in page: "${pathname}"`);
        }
        if (!isValidElementType(App)) {
            throw new Error(`The default export is not a React Component in page: "/_app"`);
        }
        if (!isValidElementType(Document)) {
            throw new Error(`The default export is not a React Component in page: "/_document"`);
        }
        if (isAutoExport || isFallback) {
            // remove query values except ones that will be set during export
            query = {
                ...query.amp ? {
                    amp: query.amp
                } : {}
            };
            asPath = `${pathname}${// ensure trailing slash is present for non-dynamic auto-export pages
            req.url.endsWith("/") && pathname !== "/" && !pageIsDynamic ? "/" : ""}`;
            req.url = pathname;
        }
        if (pathname === "/404" && (hasPageGetInitialProps || getServerSideProps)) {
            throw new Error(`\`pages/404\` ${_constants.STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR}`);
        }
        if (_constants1.STATIC_STATUS_PAGES.includes(pathname) && (hasPageGetInitialProps || getServerSideProps)) {
            throw new Error(`\`pages${pathname}\` ${_constants.STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR}`);
        }
    }
    for (const methodName of [
        "getStaticProps",
        "getServerSideProps",
        "getStaticPaths", 
    ]){
        var ref2;
        if ((ref2 = Component) == null ? void 0 : ref2[methodName]) {
            throw new Error(`page ${pathname} ${methodName} ${_constants.GSSP_COMPONENT_MEMBER_ERROR}`);
        }
    }
    await _loadable.default.preloadAll() // Make sure all dynamic imports are loaded
    ;
    let isPreview;
    let previewData;
    if ((isSSG || getServerSideProps) && !isFallback && process.env.NEXT_RUNTIME !== "edge") {
        // Reads of this are cached on the `req` object, so this should resolve
        // instantly. There's no need to pass this data down from a previous
        // invoke, where we'd have to consider server & serverless.
        previewData = tryGetPreviewData(req, res, previewProps);
        isPreview = previewData !== false;
    }
    // url will always be set
    const routerIsReady = !!(getServerSideProps || hasPageGetInitialProps || !defaultAppGetInitialProps && !isSSG);
    const router = new ServerRouter(pathname, query, asPath, {
        isFallback: isFallback
    }, routerIsReady, basePath, renderOpts.locale, renderOpts.locales, renderOpts.defaultLocale, renderOpts.domainLocales, isPreview, (0, _requestMeta).getRequestMeta(req, "__nextIsLocaleDomain"));
    let scriptLoader = {};
    const jsxStyleRegistry = (0, _styledJsx).createStyleRegistry();
    const ampState = {
        ampFirst: pageConfig.amp === true,
        hasQuery: Boolean(query.amp),
        hybrid: pageConfig.amp === "hybrid"
    };
    // Disable AMP under the web environment
    const inAmpMode = process.env.NEXT_RUNTIME !== "edge" && (0, _ampMode).isInAmpMode(ampState);
    let head = (0, _head).defaultHead(inAmpMode);
    const reactLoadableModules = [];
    let initialScripts = {};
    if (hasPageScripts) {
        initialScripts.beforeInteractive = [].concat(hasPageScripts()).filter((script)=>script.props.strategy === "beforeInteractive").map((script)=>script.props);
    }
    const AppContainer = ({ children  })=>/*#__PURE__*/ _react.default.createElement(_routerContext.RouterContext.Provider, {
            value: router
        }, /*#__PURE__*/ _react.default.createElement(_ampContext.AmpStateContext.Provider, {
            value: ampState
        }, /*#__PURE__*/ _react.default.createElement(_headManagerContext.HeadManagerContext.Provider, {
            value: {
                updateHead: (state)=>{
                    head = state;
                },
                updateScripts: (scripts)=>{
                    scriptLoader = scripts;
                },
                scripts: initialScripts,
                mountedInstances: new Set()
            }
        }, /*#__PURE__*/ _react.default.createElement(_loadableContext.LoadableContext.Provider, {
            value: (moduleName)=>reactLoadableModules.push(moduleName)
        }, /*#__PURE__*/ _react.default.createElement(_styledJsx.StyleRegistry, {
            registry: jsxStyleRegistry
        }, /*#__PURE__*/ _react.default.createElement(_imageConfigContext.ImageConfigContext.Provider, {
            value: images
        }, children))))));
    // The `useId` API uses the path indexes to generate an ID for each node.
    // To guarantee the match of hydration, we need to ensure that the structure
    // of wrapper nodes is isomorphic in server and client.
    // TODO: With `enhanceApp` and `enhanceComponents` options, this approach may
    // not be useful.
    // https://github.com/facebook/react/pull/22644
    const Noop = ()=>null;
    const AppContainerWithIsomorphicFiberStructure = ({ children  })=>{
        return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/ _react.default.createElement(Noop, null), /*#__PURE__*/ _react.default.createElement(AppContainer, null, /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, dev ? /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, children, /*#__PURE__*/ _react.default.createElement(Noop, null)) : children, /*#__PURE__*/ _react.default.createElement(Noop, null))));
    };
    const ctx = {
        err,
        req: isAutoExport ? undefined : req,
        res: isAutoExport ? undefined : res,
        pathname,
        query,
        asPath,
        locale: renderOpts.locale,
        locales: renderOpts.locales,
        defaultLocale: renderOpts.defaultLocale,
        AppTree: (props)=>{
            return /*#__PURE__*/ _react.default.createElement(AppContainerWithIsomorphicFiberStructure, null, renderPageTree(App, OriginComponent, {
                ...props,
                router
            }));
        },
        defaultGetInitialProps: async (docCtx, options = {})=>{
            const enhanceApp = (AppComp)=>{
                return (props)=>/*#__PURE__*/ _react.default.createElement(AppComp, Object.assign({}, props));
            };
            const { html , head: renderPageHead  } = await docCtx.renderPage({
                enhanceApp
            });
            const styles = jsxStyleRegistry.styles({
                nonce: options.nonce
            });
            jsxStyleRegistry.flush();
            return {
                html,
                head: renderPageHead,
                styles
            };
        }
    };
    let props1;
    const nextExport = !isSSG && (renderOpts.nextExport || dev && (isAutoExport || isFallback));
    const styledJsxFlushEffect = ()=>{
        const styles = jsxStyleRegistry.styles();
        jsxStyleRegistry.flush();
        return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, styles);
    };
    props1 = await (0, _utils).loadGetInitialProps(App, {
        AppTree: ctx.AppTree,
        Component,
        router,
        ctx
    });
    if ((isSSG || getServerSideProps) && isPreview) {
        props1.__N_PREVIEW = true;
    }
    if (isSSG) {
        props1[_constants1.STATIC_PROPS_ID] = true;
    }
    if (isSSG && !isFallback) {
        let data;
        try {
            data = await getStaticProps({
                ...pageIsDynamic ? {
                    params: query
                } : undefined,
                ...isPreview ? {
                    preview: true,
                    previewData: previewData
                } : undefined,
                locales: renderOpts.locales,
                locale: renderOpts.locale,
                defaultLocale: renderOpts.defaultLocale
            });
        } catch (staticPropsError) {
            // remove not found error code to prevent triggering legacy
            // 404 rendering
            if (staticPropsError && staticPropsError.code === "ENOENT") {
                delete staticPropsError.code;
            }
            throw staticPropsError;
        }
        if (data == null) {
            throw new Error(_constants.GSP_NO_RETURNED_VALUE);
        }
        const invalidKeys = Object.keys(data).filter((key)=>key !== "revalidate" && key !== "props" && key !== "redirect" && key !== "notFound");
        if (invalidKeys.includes("unstable_revalidate")) {
            throw new Error(_constants.UNSTABLE_REVALIDATE_RENAME_ERROR);
        }
        if (invalidKeys.length) {
            throw new Error(invalidKeysMsg("getStaticProps", invalidKeys));
        }
        if (process.env.NODE_ENV !== "production") {
            if (typeof data.notFound !== "undefined" && typeof data.redirect !== "undefined") {
                throw new Error(`\`redirect\` and \`notFound\` can not both be returned from ${isSSG ? "getStaticProps" : "getServerSideProps"} at the same time. Page: ${pathname}\nSee more info here: https://nextjs.org/docs/messages/gssp-mixed-not-found-redirect`);
            }
        }
        if ("notFound" in data && data.notFound) {
            if (pathname === "/404") {
                throw new Error(`The /404 page can not return notFound in "getStaticProps", please remove it to continue!`);
            }
            renderOpts.isNotFound = true;
        }
        if ("redirect" in data && data.redirect && typeof data.redirect === "object") {
            checkRedirectValues(data.redirect, req, "getStaticProps");
            if (isBuildTimeSSG) {
                throw new Error(`\`redirect\` can not be returned from getStaticProps during prerendering (${req.url})\n` + `See more info here: https://nextjs.org/docs/messages/gsp-redirect-during-prerender`);
            }
            data.props = {
                __N_REDIRECT: data.redirect.destination,
                __N_REDIRECT_STATUS: (0, _redirectStatus).getRedirectStatus(data.redirect)
            };
            if (typeof data.redirect.basePath !== "undefined") {
                data.props.__N_REDIRECT_BASE_PATH = data.redirect.basePath;
            }
            renderOpts.isRedirect = true;
        }
        if ((dev || isBuildTimeSSG) && !renderOpts.isNotFound && !(0, _isSerializableProps).isSerializableProps(pathname, "getStaticProps", data.props)) {
            // this fn should throw an error instead of ever returning `false`
            throw new Error("invariant: getStaticProps did not return valid props. Please report this.");
        }
        if ("revalidate" in data) {
            if (typeof data.revalidate === "number") {
                if (!Number.isInteger(data.revalidate)) {
                    throw new Error(`A page's revalidate option must be seconds expressed as a natural number for ${req.url}. Mixed numbers, such as '${data.revalidate}', cannot be used.` + `\nTry changing the value to '${Math.ceil(data.revalidate)}' or using \`Math.ceil()\` if you're computing the value.`);
                } else if (data.revalidate <= 0) {
                    throw new Error(`A page's revalidate option can not be less than or equal to zero for ${req.url}. A revalidate option of zero means to revalidate after _every_ request, and implies stale data cannot be tolerated.` + `\n\nTo never revalidate, you can set revalidate to \`false\` (only ran once at build-time).` + `\nTo revalidate as soon as possible, you can set the value to \`1\`.`);
                } else if (data.revalidate > 31536000) {
                    // if it's greater than a year for some reason error
                    console.warn(`Warning: A page's revalidate option was set to more than a year for ${req.url}. This may have been done in error.` + `\nTo only run getStaticProps at build-time and not revalidate at runtime, you can set \`revalidate\` to \`false\`!`);
                }
            } else if (data.revalidate === true) {
                // When enabled, revalidate after 1 second. This value is optimal for
                // the most up-to-date page possible, but without a 1-to-1
                // request-refresh ratio.
                data.revalidate = 1;
            } else if (data.revalidate === false || typeof data.revalidate === "undefined") {
                // By default, we never revalidate.
                data.revalidate = false;
            } else {
                throw new Error(`A page's revalidate option must be seconds expressed as a natural number. Mixed numbers and strings cannot be used. Received '${JSON.stringify(data.revalidate)}' for ${req.url}`);
            }
        } else {
            data.revalidate = false;
        }
        props1.pageProps = Object.assign({}, props1.pageProps, "props" in data ? data.props : undefined);
        renderOpts.revalidate = "revalidate" in data ? data.revalidate : undefined;
        renderOpts.pageData = props1;
        // this must come after revalidate is added to renderOpts
        if (renderOpts.isNotFound) {
            return null;
        }
    }
    if (getServerSideProps) {
        props1[_constants1.SERVER_PROPS_ID] = true;
    }
    if (getServerSideProps && !isFallback) {
        let data;
        let canAccessRes = true;
        let resOrProxy = res;
        let deferredContent = false;
        if (process.env.NODE_ENV !== "production") {
            resOrProxy = new Proxy(res, {
                get: function(obj, prop, receiver) {
                    if (!canAccessRes) {
                        const message = `You should not access 'res' after getServerSideProps resolves.` + `\nRead more: https://nextjs.org/docs/messages/gssp-no-mutating-res`;
                        if (deferredContent) {
                            throw new Error(message);
                        } else {
                            warn(message);
                        }
                    }
                    const value = Reflect.get(obj, prop, receiver);
                    // since ServerResponse uses internal fields which
                    // proxy can't map correctly we need to ensure functions
                    // are bound correctly while being proxied
                    if (typeof value === "function") {
                        return value.bind(obj);
                    }
                    return value;
                }
            });
        }
        try {
            data = await getServerSideProps({
                req: req,
                res: resOrProxy,
                query,
                resolvedUrl: renderOpts.resolvedUrl,
                ...pageIsDynamic ? {
                    params: params
                } : undefined,
                ...previewData !== false ? {
                    preview: true,
                    previewData: previewData
                } : undefined,
                locales: renderOpts.locales,
                locale: renderOpts.locale,
                defaultLocale: renderOpts.defaultLocale
            });
            canAccessRes = false;
        } catch (serverSidePropsError) {
            // remove not found error code to prevent triggering legacy
            // 404 rendering
            if ((0, _isError).default(serverSidePropsError) && serverSidePropsError.code === "ENOENT") {
                delete serverSidePropsError.code;
            }
            throw serverSidePropsError;
        }
        if (data == null) {
            throw new Error(_constants.GSSP_NO_RETURNED_VALUE);
        }
        if (data.props instanceof Promise) {
            deferredContent = true;
        }
        const invalidKeys = Object.keys(data).filter((key)=>key !== "props" && key !== "redirect" && key !== "notFound");
        if (data.unstable_notFound) {
            throw new Error(`unstable_notFound has been renamed to notFound, please update the field to continue. Page: ${pathname}`);
        }
        if (data.unstable_redirect) {
            throw new Error(`unstable_redirect has been renamed to redirect, please update the field to continue. Page: ${pathname}`);
        }
        if (invalidKeys.length) {
            throw new Error(invalidKeysMsg("getServerSideProps", invalidKeys));
        }
        if ("notFound" in data && data.notFound) {
            if (pathname === "/404") {
                throw new Error(`The /404 page can not return notFound in "getStaticProps", please remove it to continue!`);
            }
            renderOpts.isNotFound = true;
            return null;
        }
        if ("redirect" in data && typeof data.redirect === "object") {
            checkRedirectValues(data.redirect, req, "getServerSideProps");
            data.props = {
                __N_REDIRECT: data.redirect.destination,
                __N_REDIRECT_STATUS: (0, _redirectStatus).getRedirectStatus(data.redirect)
            };
            if (typeof data.redirect.basePath !== "undefined") {
                data.props.__N_REDIRECT_BASE_PATH = data.redirect.basePath;
            }
            renderOpts.isRedirect = true;
        }
        if (deferredContent) {
            data.props = await data.props;
        }
        if ((dev || isBuildTimeSSG) && !(0, _isSerializableProps).isSerializableProps(pathname, "getServerSideProps", data.props)) {
            // this fn should throw an error instead of ever returning `false`
            throw new Error("invariant: getServerSideProps did not return valid props. Please report this.");
        }
        props1.pageProps = Object.assign({}, props1.pageProps, data.props);
        renderOpts.pageData = props1;
    }
    if (!isSSG && !getServerSideProps && process.env.NODE_ENV !== "production" && Object.keys((props1 == null ? void 0 : props1.pageProps) || {}).includes("url")) {
        console.warn(`The prop \`url\` is a reserved prop in Next.js for legacy reasons and will be overridden on page ${pathname}\n` + `See more info here: https://nextjs.org/docs/messages/reserved-page-prop`);
    }
    // Avoid rendering page un-necessarily for getServerSideProps data request
    // and getServerSideProps/getStaticProps redirects
    if (isDataReq && !isSSG || renderOpts.isRedirect) {
        return _renderResult.default.fromStatic(JSON.stringify(props1));
    }
    // We don't call getStaticProps or getServerSideProps while generating
    // the fallback so make sure to set pageProps to an empty object
    if (isFallback) {
        props1.pageProps = {};
    }
    // the response might be finished on the getInitialProps call
    if ((0, _utils).isResSent(res) && !isSSG) return null;
    // we preload the buildManifest for auto-export dynamic pages
    // to speed up hydrating query values
    let filteredBuildManifest = buildManifest;
    if (isAutoExport && pageIsDynamic) {
        const page = (0, _denormalizePagePath).denormalizePagePath((0, _normalizePagePath).normalizePagePath(pathname));
        // This code would be much cleaner using `immer` and directly pushing into
        // the result from `getPageFiles`, we could maybe consider that in the
        // future.
        if (page in filteredBuildManifest.pages) {
            filteredBuildManifest = {
                ...filteredBuildManifest,
                pages: {
                    ...filteredBuildManifest.pages,
                    [page]: [
                        ...filteredBuildManifest.pages[page],
                        ...filteredBuildManifest.lowPriorityFiles.filter((f)=>f.includes("_buildManifest")), 
                    ]
                },
                lowPriorityFiles: filteredBuildManifest.lowPriorityFiles.filter((f)=>!f.includes("_buildManifest"))
            };
        }
    }
    const Body = ({ children  })=>{
        return inAmpMode ? children : /*#__PURE__*/ _react.default.createElement("div", {
            id: "__next"
        }, children);
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
    const renderDocument = async ()=>{
        // For `Document`, there are two cases that we don't support:
        // 1. Using `Document.getInitialProps` in the Edge runtime.
        // 2. Using the class component `Document` with concurrent features.
        const BuiltinFunctionalDocument = Document[_constants1.NEXT_BUILTIN_DOCUMENT];
        if (process.env.NEXT_RUNTIME === "edge" && Document.getInitialProps) {
            // In the Edge runtime, `Document.getInitialProps` isn't supported.
            // We throw an error here if it's customized.
            if (!BuiltinFunctionalDocument) {
                throw new Error("`getInitialProps` in Document component is not supported with the Edge Runtime.");
            }
        }
        if (process.env.NEXT_RUNTIME === "edge" && Document.getInitialProps) {
            if (BuiltinFunctionalDocument) {
                Document = BuiltinFunctionalDocument;
            } else {
                throw new Error("`getInitialProps` in Document component is not supported with React Server Components.");
            }
        }
        async function loadDocumentInitialProps(renderShell) {
            const renderPage = (options = {})=>{
                if (ctx.err && ErrorDebug) {
                    // Always start rendering the shell even if there's an error.
                    if (renderShell) {
                        renderShell(App, Component);
                    }
                    const html = ReactDOMServer.renderToString(/*#__PURE__*/ _react.default.createElement(Body, null, /*#__PURE__*/ _react.default.createElement(ErrorDebug, {
                        error: ctx.err
                    })));
                    return {
                        html,
                        head
                    };
                }
                if (dev && (props1.router || props1.Component)) {
                    throw new Error(`'router' and 'Component' can not be returned in getInitialProps from _app.js https://nextjs.org/docs/messages/cant-override-next-props`);
                }
                const { App: EnhancedApp , Component: EnhancedComponent  } = enhanceComponents(options, App, Component);
                if (renderShell) {
                    return renderShell(EnhancedApp, EnhancedComponent).then(async (stream)=>{
                        const forwardStream = (0, _nodeWebStreamsHelper).readableStreamTee(stream)[1];
                        const html = await (0, _nodeWebStreamsHelper).streamToString(forwardStream);
                        return {
                            html,
                            head
                        };
                    });
                }
                const html1 = ReactDOMServer.renderToString(/*#__PURE__*/ _react.default.createElement(Body, null, /*#__PURE__*/ _react.default.createElement(AppContainerWithIsomorphicFiberStructure, null, renderPageTree(EnhancedApp, EnhancedComponent, {
                    ...props1,
                    router
                }))));
                return {
                    html: html1,
                    head
                };
            };
            const documentCtx = {
                ...ctx,
                renderPage
            };
            const docProps = await (0, _utils).loadGetInitialProps(Document, documentCtx);
            // the response might be finished on the getInitialProps call
            if ((0, _utils).isResSent(res) && !isSSG) return null;
            if (!docProps || typeof docProps.html !== "string") {
                const message = `"${(0, _utils).getDisplayName(Document)}.getInitialProps()" should resolve to an object with a "html" prop set with a valid html string`;
                throw new Error(message);
            }
            return {
                docProps,
                documentCtx
            };
        }
        const renderContent = (_App, _Component)=>{
            const EnhancedApp = _App || App;
            const EnhancedComponent = _Component || Component;
            return ctx.err && ErrorDebug ? /*#__PURE__*/ _react.default.createElement(Body, null, /*#__PURE__*/ _react.default.createElement(ErrorDebug, {
                error: ctx.err
            })) : /*#__PURE__*/ _react.default.createElement(Body, null, /*#__PURE__*/ _react.default.createElement(AppContainerWithIsomorphicFiberStructure, null, renderPageTree(EnhancedApp, EnhancedComponent, {
                ...props1,
                router
            })));
        };
        if (!process.env.__NEXT_REACT_ROOT) {
            // Enabling react legacy rendering mode: __NEXT_REACT_ROOT = false
            if (Document.getInitialProps) {
                const documentInitialProps = await loadDocumentInitialProps();
                if (documentInitialProps === null) return null;
                const { docProps , documentCtx  } = documentInitialProps;
                return {
                    bodyResult: (suffix)=>(0, _nodeWebStreamsHelper).streamFromArray([
                            docProps.html,
                            suffix
                        ]),
                    documentElement: (htmlProps)=>/*#__PURE__*/ _react.default.createElement(Document, Object.assign({}, htmlProps, docProps)),
                    head: docProps.head,
                    headTags: await headTags(documentCtx),
                    styles: docProps.styles
                };
            } else {
                const content = renderContent(App, Component);
                // for non-concurrent rendering we need to ensure App is rendered
                // before _document so that updateHead is called/collected before
                // rendering _document's head
                const result = ReactDOMServer.renderToString(content);
                const bodyResult = (suffix)=>(0, _nodeWebStreamsHelper).streamFromArray([
                        result,
                        suffix
                    ]);
                const styles = jsxStyleRegistry.styles();
                jsxStyleRegistry.flush();
                return {
                    bodyResult,
                    documentElement: ()=>Document(),
                    head,
                    headTags: [],
                    styles
                };
            }
        } else {
            // Enabling react concurrent rendering mode: __NEXT_REACT_ROOT = true
            const renderShell = async (EnhancedApp, EnhancedComponent)=>{
                const content = renderContent(EnhancedApp, EnhancedComponent);
                return await (0, _nodeWebStreamsHelper).renderToInitialStream({
                    ReactDOMServer,
                    element: content
                });
            };
            const createBodyResult = (initialStream, suffix)=>{
                // this must be called inside bodyResult so appWrappers is
                // up to date when `wrapApp` is called
                const flushEffectHandler = ()=>{
                    const flushed = ReactDOMServer.renderToString(styledJsxFlushEffect());
                    return flushed;
                };
                return (0, _nodeWebStreamsHelper).continueFromInitialStream(initialStream, {
                    suffix,
                    dataStream: serverComponentsInlinedTransformStream == null ? void 0 : serverComponentsInlinedTransformStream.readable,
                    generateStaticHTML,
                    flushEffectHandler,
                    flushEffectsToHead: false
                });
            };
            const hasDocumentGetInitialProps = !(process.env.NEXT_RUNTIME === "edge" || !Document.getInitialProps);
            let bodyResult;
            // If it has getInitialProps, we will render the shell in `renderPage`.
            // Otherwise we do it right now.
            let documentInitialPropsRes;
            if (hasDocumentGetInitialProps) {
                documentInitialPropsRes = await loadDocumentInitialProps(renderShell);
                if (documentInitialPropsRes === null) return null;
                const { docProps  } = documentInitialPropsRes;
                // includes suffix in initial html stream
                bodyResult = (suffix)=>createBodyResult((0, _nodeWebStreamsHelper).streamFromArray([
                        docProps.html,
                        suffix
                    ]));
            } else {
                const stream = await renderShell(App, Component);
                bodyResult = (suffix)=>createBodyResult(stream, suffix);
                documentInitialPropsRes = {};
            }
            const { docProps  } = documentInitialPropsRes || {};
            const documentElement = (htmlProps)=>{
                if (process.env.NEXT_RUNTIME === "edge") {
                    return Document();
                } else {
                    return /*#__PURE__*/ _react.default.createElement(Document, Object.assign({}, htmlProps, docProps));
                }
            };
            let styles;
            if (hasDocumentGetInitialProps) {
                styles = docProps.styles;
                head = docProps.head;
            } else {
                styles = jsxStyleRegistry.styles();
                jsxStyleRegistry.flush();
            }
            return {
                bodyResult,
                documentElement,
                head,
                headTags: [],
                styles
            };
        }
    };
    const documentResult = await renderDocument();
    if (!documentResult) {
        return null;
    }
    const dynamicImportsIds = new Set();
    const dynamicImports = new Set();
    for (const mod of reactLoadableModules){
        const manifestItem = reactLoadableManifest[mod];
        if (manifestItem) {
            dynamicImportsIds.add(manifestItem.id);
            manifestItem.files.forEach((item)=>{
                dynamicImports.add(item);
            });
        }
    }
    const hybridAmp = ampState.hybrid;
    const docComponentsRendered = {};
    const { assetPrefix , buildId , customServer , defaultLocale , disableOptimizedLoading , domainLocales , locale , locales , runtimeConfig ,  } = renderOpts;
    const htmlProps1 = {
        __NEXT_DATA__: {
            props: props1,
            page: pathname,
            query,
            buildId,
            assetPrefix: assetPrefix === "" ? undefined : assetPrefix,
            runtimeConfig,
            nextExport: nextExport === true ? true : undefined,
            autoExport: isAutoExport === true ? true : undefined,
            isFallback,
            dynamicIds: dynamicImportsIds.size === 0 ? undefined : Array.from(dynamicImportsIds),
            err: renderOpts.err ? serializeError(dev, renderOpts.err) : undefined,
            gsp: !!getStaticProps ? true : undefined,
            gssp: !!getServerSideProps ? true : undefined,
            customServer,
            gip: hasPageGetInitialProps ? true : undefined,
            appGip: !defaultAppGetInitialProps ? true : undefined,
            locale,
            locales,
            defaultLocale,
            domainLocales,
            isPreview: isPreview === true ? true : undefined,
            notFoundSrcPage: notFoundSrcPage && dev ? notFoundSrcPage : undefined
        },
        buildManifest: filteredBuildManifest,
        docComponentsRendered,
        dangerousAsPath: router.asPath,
        canonicalBase: !renderOpts.ampPath && (0, _requestMeta).getRequestMeta(req, "__nextStrippedLocale") ? `${renderOpts.canonicalBase || ""}/${renderOpts.locale}` : renderOpts.canonicalBase,
        ampPath,
        inAmpMode,
        isDevelopment: !!dev,
        hybridAmp,
        dynamicImports: Array.from(dynamicImports),
        assetPrefix,
        // Only enabled in production as development mode has features relying on HMR (style injection for example)
        unstable_runtimeJS: process.env.NODE_ENV === "production" ? pageConfig.unstable_runtimeJS : undefined,
        unstable_JsPreload: pageConfig.unstable_JsPreload,
        devOnlyCacheBusterQueryString,
        scriptLoader,
        locale,
        disableOptimizedLoading,
        head: documentResult.head,
        headTags: documentResult.headTags,
        styles: documentResult.styles,
        crossOrigin: renderOpts.crossOrigin,
        optimizeCss: renderOpts.optimizeCss,
        optimizeFonts: renderOpts.optimizeFonts,
        nextScriptWorkers: renderOpts.nextScriptWorkers,
        runtime: globalRuntime,
        largePageDataBytes: renderOpts.largePageDataBytes
    };
    const document = /*#__PURE__*/ _react.default.createElement(_ampContext.AmpStateContext.Provider, {
        value: ampState
    }, /*#__PURE__*/ _react.default.createElement(_htmlContext.HtmlContext.Provider, {
        value: htmlProps1
    }, documentResult.documentElement(htmlProps1)));
    const documentHTML = ReactDOMServer.renderToStaticMarkup(document);
    if (process.env.NODE_ENV !== "production") {
        const nonRenderedComponents = [];
        const expectedDocComponents = [
            "Main",
            "Head",
            "NextScript",
            "Html"
        ];
        for (const comp of expectedDocComponents){
            if (!docComponentsRendered[comp]) {
                nonRenderedComponents.push(comp);
            }
        }
        if (nonRenderedComponents.length) {
            const missingComponentList = nonRenderedComponents.map((e)=>`<${e} />`).join(", ");
            const plural = nonRenderedComponents.length !== 1 ? "s" : "";
            console.warn(`Your custom Document (pages/_document) did not render all the required subcomponent${plural}.\n` + `Missing component${plural}: ${missingComponentList}\n` + "Read how to fix here: https://nextjs.org/docs/messages/missing-document-component");
        }
    }
    const [renderTargetPrefix, renderTargetSuffix] = documentHTML.split("<next-js-internal-body-render-target></next-js-internal-body-render-target>");
    const prefix = [];
    if (!documentHTML.startsWith(DOCTYPE)) {
        prefix.push(DOCTYPE);
    }
    prefix.push(renderTargetPrefix);
    if (inAmpMode) {
        prefix.push("<!-- __NEXT_DATA__ -->");
    }
    const streams = [
        (0, _nodeWebStreamsHelper).streamFromArray(prefix),
        await documentResult.bodyResult(renderTargetSuffix), 
    ];
    const postOptimize = (html)=>postProcessHTML(pathname, html, renderOpts, {
            inAmpMode,
            hybridAmp
        });
    if (generateStaticHTML) {
        const html = await (0, _nodeWebStreamsHelper).streamToString((0, _nodeWebStreamsHelper).chainStreams(streams));
        const optimizedHtml = await postOptimize(html);
        return new _renderResult.default(optimizedHtml);
    }
    return new _renderResult.default((0, _nodeWebStreamsHelper).chainStreams(streams).pipeThrough((0, _nodeWebStreamsHelper).createBufferedTransformStream(postOptimize)));
}

//# sourceMappingURL=render.js.map