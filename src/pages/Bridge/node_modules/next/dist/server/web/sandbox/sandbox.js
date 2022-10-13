"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.run = exports.getRuntimeContext = exports.ErrorSource = void 0;
var _middleware = require("next/dist/compiled/@next/react-dev-overlay/dist/middleware");
var _context = require("./context");
var _bodyStreams = require("../../body-streams");
const ErrorSource = Symbol("SandboxError");
exports.ErrorSource = ErrorSource;
const FORBIDDEN_HEADERS = [
    "content-length",
    "content-encoding",
    "transfer-encoding", 
];
/**
 * Decorates the runner function making sure all errors it can produce are
 * tagged with `edge-server` so they can properly be rendered in dev.
 */ function withTaggedErrors(fn) {
    return (params)=>{
        return fn(params).then((result)=>{
            var ref;
            return {
                ...result,
                waitUntil: result == null ? void 0 : (ref = result.waitUntil) == null ? void 0 : ref.catch((error)=>{
                    // TODO: used COMPILER_NAMES.edgeServer instead. Verify that it does not increase the runtime size.
                    throw (0, _middleware).getServerError(error, "edge-server");
                })
            };
        }).catch((error)=>{
            // TODO: used COMPILER_NAMES.edgeServer instead
            throw (0, _middleware).getServerError(error, "edge-server");
        });
    };
}
const getRuntimeContext = async (params)=>{
    var _onWarning;
    const { runtime , evaluateInContext  } = await (0, _context).getModuleContext({
        moduleName: params.name,
        onWarning: (_onWarning = params.onWarning) != null ? _onWarning : ()=>{},
        useCache: params.useCache !== false,
        env: params.env,
        edgeFunctionEntry: params.edgeFunctionEntry,
        distDir: params.distDir
    });
    for (const paramPath of params.paths){
        evaluateInContext(paramPath);
    }
    return runtime;
};
exports.getRuntimeContext = getRuntimeContext;
const run = withTaggedErrors(async (params)=>{
    var ref;
    const runtime = await getRuntimeContext(params);
    const subreq = params.request.headers[`x-middleware-subrequest`];
    const subrequests = typeof subreq === "string" ? subreq.split(":") : [];
    if (subrequests.includes(params.name)) {
        return {
            waitUntil: Promise.resolve(),
            response: new runtime.context.Response(null, {
                headers: {
                    "x-middleware-next": "1"
                }
            })
        };
    }
    const edgeFunction = runtime.context._ENTRIES[`middleware_${params.name}`].default;
    const cloned = ![
        "HEAD",
        "GET"
    ].includes(params.request.method) ? (ref = params.request.body) == null ? void 0 : ref.cloneBodyStream() : undefined;
    try {
        const result = await edgeFunction({
            request: {
                ...params.request,
                body: cloned && (0, _bodyStreams).requestToBodyStream(runtime.context, cloned)
            }
        });
        for (const headerName of FORBIDDEN_HEADERS){
            result.response.headers.delete(headerName);
        }
        return result;
    } finally{
        var ref1;
        await ((ref1 = params.request.body) == null ? void 0 : ref1.finalize());
    }
});
exports.run = run;

//# sourceMappingURL=sandbox.js.map