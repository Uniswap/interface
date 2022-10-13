"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.clearModuleContext = clearModuleContext;
exports.getModuleContext = getModuleContext;
var _middleware = require("next/dist/compiled/@next/react-dev-overlay/dist/middleware");
var _constants = require("../../../shared/lib/constants");
var _edgeRuntime = require("next/dist/compiled/edge-runtime");
var _fs = require("fs");
var _utils = require("../utils");
var _pick = require("../../../lib/pick");
var _fetchInlineAssets = require("./fetch-inline-assets");
const WEBPACK_HASH_REGEX = /__webpack_require__\.h = function\(\) \{ return "[0-9a-f]+"; \}/g;
/**
 * A Map of cached module contexts indexed by the module name. It allows
 * to have a different cache scoped per module name or depending on the
 * provided module key on creation.
 */ const moduleContexts = new Map();
function clearModuleContext(path, content) {
    for (const [key, cache] of moduleContexts){
        var ref;
        const prev = (ref = cache == null ? void 0 : cache.paths.get(path)) == null ? void 0 : ref.replace(WEBPACK_HASH_REGEX, "");
        if (typeof prev !== "undefined" && prev !== content.toString().replace(WEBPACK_HASH_REGEX, "")) {
            moduleContexts.delete(key);
        }
    }
}
async function loadWasm(wasm) {
    const modules = {};
    await Promise.all(wasm.map(async (binding)=>{
        const module = await WebAssembly.compile(await _fs.promises.readFile(binding.filePath));
        modules[binding.name] = module;
    }));
    return modules;
}
function buildEnvironmentVariablesFrom(keys) {
    const pairs = keys.map((key)=>[
            key,
            process.env[key]
        ]);
    const env = Object.fromEntries(pairs);
    env.NEXT_RUNTIME = "edge";
    return env;
}
function throwUnsupportedAPIError(name) {
    const error = new Error(`A Node.js API is used (${name}) which is not supported in the Edge Runtime.
Learn more: https://nextjs.org/docs/api-reference/edge-runtime`);
    (0, _middleware).decorateServerError(error, _constants.COMPILER_NAMES.edgeServer);
    throw error;
}
function createProcessPolyfill(options) {
    const env = buildEnvironmentVariablesFrom(options.env);
    const processPolyfill = {
        env
    };
    const overridenValue = {};
    for (const key of Object.keys(process)){
        if (key === "env") continue;
        Object.defineProperty(processPolyfill, key, {
            get () {
                if (overridenValue[key]) {
                    return overridenValue[key];
                }
                if (typeof process[key] === "function") {
                    return ()=>throwUnsupportedAPIError(`process.${key}`);
                }
                return undefined;
            },
            set (value) {
                overridenValue[key] = value;
            },
            enumerable: false
        });
    }
    return processPolyfill;
}
function addStub(context, name) {
    Object.defineProperty(context, name, {
        get () {
            return function() {
                throwUnsupportedAPIError(name);
            };
        },
        enumerable: false
    });
}
function getDecorateUnhandledError(runtime) {
    const EdgeRuntimeError = runtime.evaluate(`Error`);
    return (error)=>{
        if (error instanceof EdgeRuntimeError) {
            (0, _middleware).decorateServerError(error, _constants.COMPILER_NAMES.edgeServer);
        }
    };
}
/**
 * Create a module cache specific for the provided parameters. It includes
 * a runtime context, require cache and paths cache.
 */ async function createModuleContext(options) {
    const warnedEvals = new Set();
    const warnedWasmCodegens = new Set();
    var _wasm;
    const wasm = await loadWasm((_wasm = options.edgeFunctionEntry.wasm) != null ? _wasm : []);
    const runtime = new _edgeRuntime.EdgeRuntime({
        codeGeneration: process.env.NODE_ENV !== "production" ? {
            strings: true,
            wasm: true
        } : undefined,
        extend: (context)=>{
            context.process = createProcessPolyfill(options);
            context.__next_eval__ = function __next_eval__(fn) {
                const key = fn.toString();
                if (!warnedEvals.has(key)) {
                    const warning = (0, _middleware).getServerError(new Error(`Dynamic Code Evaluation (e. g. 'eval', 'new Function') not allowed in Edge Runtime
Learn More: https://nextjs.org/docs/messages/edge-dynamic-code-evaluation`), _constants.COMPILER_NAMES.edgeServer);
                    warning.name = "DynamicCodeEvaluationWarning";
                    Error.captureStackTrace(warning, __next_eval__);
                    warnedEvals.add(key);
                    options.onWarning(warning);
                }
                return fn();
            };
            context.__next_webassembly_compile__ = function __next_webassembly_compile__(fn) {
                const key = fn.toString();
                if (!warnedWasmCodegens.has(key)) {
                    const warning = (0, _middleware).getServerError(new Error(`Dynamic WASM code generation (e. g. 'WebAssembly.compile') not allowed in Edge Runtime.
Learn More: https://nextjs.org/docs/messages/edge-dynamic-code-evaluation`), _constants.COMPILER_NAMES.edgeServer);
                    warning.name = "DynamicWasmCodeGenerationWarning";
                    Error.captureStackTrace(warning, __next_webassembly_compile__);
                    warnedWasmCodegens.add(key);
                    options.onWarning(warning);
                }
                return fn();
            };
            context.__next_webassembly_instantiate__ = async function __next_webassembly_instantiate__(fn) {
                const result = await fn();
                // If a buffer is given, WebAssembly.instantiate returns an object
                // containing both a module and an instance while it returns only an
                // instance if a WASM module is given. Utilize the fact to determine
                // if the WASM code generation happens.
                //
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate#primary_overload_%E2%80%94_taking_wasm_binary_code
                const instantiatedFromBuffer = result.hasOwnProperty("module");
                const key = fn.toString();
                if (instantiatedFromBuffer && !warnedWasmCodegens.has(key)) {
                    const warning = (0, _middleware).getServerError(new Error(`Dynamic WASM code generation ('WebAssembly.instantiate' with a buffer parameter) not allowed in Edge Runtime.
Learn More: https://nextjs.org/docs/messages/edge-dynamic-code-evaluation`), _constants.COMPILER_NAMES.edgeServer);
                    warning.name = "DynamicWasmCodeGenerationWarning";
                    Error.captureStackTrace(warning, __next_webassembly_instantiate__);
                    warnedWasmCodegens.add(key);
                    options.onWarning(warning);
                }
                return result;
            };
            const __fetch = context.fetch;
            context.fetch = async (input, init = {})=>{
                var ref;
                const assetResponse = await (0, _fetchInlineAssets).fetchInlineAsset({
                    input,
                    assets: options.edgeFunctionEntry.assets,
                    distDir: options.distDir,
                    context
                });
                if (assetResponse) {
                    return assetResponse;
                }
                var _headers;
                init.headers = new Headers((_headers = init.headers) != null ? _headers : {});
                const prevs = ((ref = init.headers.get(`x-middleware-subrequest`)) == null ? void 0 : ref.split(":")) || [];
                const value = prevs.concat(options.moduleName).join(":");
                init.headers.set("x-middleware-subrequest", value);
                if (!init.headers.has("user-agent")) {
                    init.headers.set(`user-agent`, `Next.js Middleware`);
                }
                if (typeof input === "object" && "url" in input) {
                    return __fetch(input.url, {
                        ...(0, _pick).pick(input, [
                            "method",
                            "body",
                            "cache",
                            "credentials",
                            "integrity",
                            "keepalive",
                            "mode",
                            "redirect",
                            "referrer",
                            "referrerPolicy",
                            "signal", 
                        ]),
                        ...init,
                        headers: {
                            ...Object.fromEntries(input.headers),
                            ...Object.fromEntries(init.headers)
                        }
                    });
                }
                return __fetch(String(input), init);
            };
            const __Request = context.Request;
            context.Request = class extends __Request {
                constructor(input, init){
                    const url = typeof input !== "string" && "url" in input ? input.url : String(input);
                    (0, _utils).validateURL(url);
                    super(url, init);
                }
            };
            const __redirect = context.Response.redirect.bind(context.Response);
            context.Response.redirect = (...args)=>{
                (0, _utils).validateURL(args[0]);
                return __redirect(...args);
            };
            for (const name of _constants.EDGE_UNSUPPORTED_NODE_APIS){
                addStub(context, name);
            }
            Object.assign(context, wasm);
            return context;
        }
    });
    const decorateUnhandledError = getDecorateUnhandledError(runtime);
    runtime.context.addEventListener("unhandledrejection", decorateUnhandledError);
    runtime.context.addEventListener("error", decorateUnhandledError);
    return {
        runtime,
        paths: new Map(),
        warnedEvals: new Set()
    };
}
const pendingModuleCaches = new Map();
function getModuleContextShared(options) {
    let deferredModuleContext = pendingModuleCaches.get(options.moduleName);
    if (!deferredModuleContext) {
        deferredModuleContext = createModuleContext(options);
        pendingModuleCaches.set(options.moduleName, deferredModuleContext);
    }
    return deferredModuleContext;
}
async function getModuleContext(options) {
    let moduleContext = options.useCache ? moduleContexts.get(options.moduleName) : await getModuleContextShared(options);
    if (!moduleContext) {
        moduleContext = await createModuleContext(options);
        moduleContexts.set(options.moduleName, moduleContext);
    }
    const evaluateInContext = (filepath)=>{
        if (!moduleContext.paths.has(filepath)) {
            const content = (0, _fs).readFileSync(filepath, "utf-8");
            try {
                moduleContext == null ? void 0 : moduleContext.runtime.evaluate(content);
                moduleContext.paths.set(filepath, content);
            } catch (error) {
                if (options.useCache) {
                    moduleContext == null ? void 0 : moduleContext.paths.delete(options.moduleName);
                }
                throw error;
            }
        }
    };
    return {
        ...moduleContext,
        evaluateInContext
    };
}

//# sourceMappingURL=context.js.map