"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getRSCModuleType = getRSCModuleType;
exports.checkExports = checkExports;
exports.getPageStaticInfo = getPageStaticInfo;
var _configShared = require("../../server/config-shared");
var _extractConstValue = require("./extract-const-value");
var _parseModule = require("./parse-module");
var _fs = require("fs");
var _tryToParsePath = require("../../lib/try-to-parse-path");
var Log = _interopRequireWildcard(require("../output/log"));
var _constants = require("../../lib/constants");
var _loadCustomRoutes = require("../../lib/load-custom-routes");
var _micromatch = require("next/dist/compiled/micromatch");
var _constants1 = require("../../shared/lib/constants");
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
const CLIENT_MODULE_LABEL = `/* __next_internal_client_entry_do_not_use__ */`;
function getRSCModuleType(source) {
    return source.includes(CLIENT_MODULE_LABEL) ? _constants1.RSC_MODULE_TYPES.client : _constants1.RSC_MODULE_TYPES.server;
}
function checkExports(swcAST) {
    if (Array.isArray(swcAST == null ? void 0 : swcAST.body)) {
        try {
            for (const node of swcAST.body){
                var ref6, ref1, ref2;
                if (node.type === "ExportDeclaration" && ((ref6 = node.declaration) == null ? void 0 : ref6.type) === "FunctionDeclaration" && [
                    "getStaticProps",
                    "getServerSideProps"
                ].includes((ref1 = node.declaration.identifier) == null ? void 0 : ref1.value)) {
                    return {
                        ssg: node.declaration.identifier.value === "getStaticProps",
                        ssr: node.declaration.identifier.value === "getServerSideProps"
                    };
                }
                if (node.type === "ExportDeclaration" && ((ref2 = node.declaration) == null ? void 0 : ref2.type) === "VariableDeclaration") {
                    var ref3, ref4;
                    const id = (ref4 = (ref3 = node.declaration) == null ? void 0 : ref3.declarations[0]) == null ? void 0 : ref4.id.value;
                    if ([
                        "getStaticProps",
                        "getServerSideProps"
                    ].includes(id)) {
                        return {
                            ssg: id === "getStaticProps",
                            ssr: id === "getServerSideProps"
                        };
                    }
                }
                if (node.type === "ExportNamedDeclaration") {
                    const values = node.specifiers.map((specifier)=>{
                        var ref, ref5;
                        return specifier.type === "ExportSpecifier" && ((ref = specifier.orig) == null ? void 0 : ref.type) === "Identifier" && ((ref5 = specifier.orig) == null ? void 0 : ref5.value);
                    });
                    return {
                        ssg: values.some((value)=>[
                                "getStaticProps"
                            ].includes(value)),
                        ssr: values.some((value)=>[
                                "getServerSideProps"
                            ].includes(value))
                    };
                }
            }
        } catch (err) {}
    }
    return {
        ssg: false,
        ssr: false
    };
}
async function tryToReadFile(filePath, shouldThrow) {
    try {
        return await _fs.promises.readFile(filePath, {
            encoding: "utf8"
        });
    } catch (error) {
        if (shouldThrow) {
            throw error;
        }
    }
}
function getMiddlewareMatchers(matcherOrMatchers, nextConfig) {
    let matchers = [];
    if (Array.isArray(matcherOrMatchers)) {
        matchers = matcherOrMatchers;
    } else {
        matchers.push(matcherOrMatchers);
    }
    const { i18n  } = nextConfig;
    let routes = matchers.map((m)=>typeof m === "string" ? {
            source: m
        } : m);
    // check before we process the routes and after to ensure
    // they are still valid
    (0, _loadCustomRoutes).checkCustomRoutes(routes, "middleware");
    routes = routes.map((r)=>{
        let { source  } = r;
        const isRoot = source === "/";
        if ((i18n == null ? void 0 : i18n.locales) && r.locale !== false) {
            source = `/:nextInternalLocale([^/.]{1,})${isRoot ? "" : source}`;
        }
        source = `/:nextData(_next/data/[^/]{1,})?${source}${isRoot ? `(${nextConfig.i18n ? "|\\.json|" : ""}/?index|/?index\\.json)?` : "(.json)?"}`;
        if (nextConfig.basePath) {
            source = `${nextConfig.basePath}${source}`;
        }
        return {
            ...r,
            source
        };
    });
    (0, _loadCustomRoutes).checkCustomRoutes(routes, "middleware");
    return routes.map((r)=>{
        const { source , ...rest } = r;
        const parsedPage = (0, _tryToParsePath).tryToParsePath(source);
        if (parsedPage.error || !parsedPage.regexStr) {
            throw new Error(`Invalid source: ${source}`);
        }
        return {
            ...rest,
            regexp: parsedPage.regexStr
        };
    });
}
function getMiddlewareConfig(pageFilePath, config, nextConfig) {
    const result = {};
    if (config.matcher) {
        result.matchers = getMiddlewareMatchers(config.matcher, nextConfig);
    }
    if (config.unstable_allowDynamic) {
        result.unstable_allowDynamicGlobs = Array.isArray(config.unstable_allowDynamic) ? config.unstable_allowDynamic : [
            config.unstable_allowDynamic
        ];
        var _unstable_allowDynamicGlobs;
        for (const glob of (_unstable_allowDynamicGlobs = result.unstable_allowDynamicGlobs) != null ? _unstable_allowDynamicGlobs : []){
            try {
                (0, _micromatch).matcher(glob);
            } catch (err) {
                throw new Error(`${pageFilePath} exported 'config.unstable_allowDynamic' contains invalid pattern '${glob}': ${err.message}`);
            }
        }
    }
    return result;
}
let warnedAboutExperimentalEdgeApiFunctions = false;
function warnAboutExperimentalEdgeApiFunctions() {
    if (warnedAboutExperimentalEdgeApiFunctions) {
        return;
    }
    Log.warn(`You are using an experimental edge runtime, the API might change.`);
    warnedAboutExperimentalEdgeApiFunctions = true;
}
const warnedUnsupportedValueMap = new Map();
function warnAboutUnsupportedValue(pageFilePath, page, error) {
    if (warnedUnsupportedValueMap.has(pageFilePath)) {
        return;
    }
    Log.warn(`Next.js can't recognize the exported \`config\` field in ` + (page ? `route "${page}"` : `"${pageFilePath}"`) + ":\n" + error.message + (error.path ? ` at "${error.path}"` : "") + ".\n" + "The default config will be used instead.\n" + "Read More - https://nextjs.org/docs/messages/invalid-page-config");
    warnedUnsupportedValueMap.set(pageFilePath, true);
}
async function getPageStaticInfo(params) {
    var ref;
    const { isDev , pageFilePath , nextConfig , page  } = params;
    const fileContent = await tryToReadFile(pageFilePath, !isDev) || "";
    if (/runtime|getStaticProps|getServerSideProps|matcher|unstable_allowDynamic/.test(fileContent)) {
        var ref10;
        const swcAST = await (0, _parseModule).parseModule(pageFilePath, fileContent);
        const { ssg , ssr  } = checkExports(swcAST);
        const rsc = getRSCModuleType(fileContent);
        // default / failsafe value for config
        let config = {};
        try {
            config = (0, _extractConstValue).extractExportedConstValue(swcAST, "config");
        } catch (e) {
            if (e instanceof _extractConstValue.UnsupportedValueError) {
                warnAboutUnsupportedValue(pageFilePath, page, e);
            }
        // `export config` doesn't exist, or other unknown error throw by swc, silence them
        }
        if (typeof config.runtime !== "undefined" && !(0, _configShared).isServerRuntime(config.runtime)) {
            const options = Object.values(_constants.SERVER_RUNTIME).join(", ");
            if (typeof config.runtime !== "string") {
                Log.error(`The \`runtime\` config must be a string. Please leave it empty or choose one of: ${options}`);
            } else {
                Log.error(`Provided runtime "${config.runtime}" is not supported. Please leave it empty or choose one of: ${options}`);
            }
            if (!isDev) {
                process.exit(1);
            }
        }
        let runtime = _constants.SERVER_RUNTIME.edge === (config == null ? void 0 : config.runtime) ? _constants.SERVER_RUNTIME.edge : ssr || ssg ? (config == null ? void 0 : config.runtime) || ((ref10 = nextConfig.experimental) == null ? void 0 : ref10.runtime) : undefined;
        if (runtime === _constants.SERVER_RUNTIME.edge) {
            warnAboutExperimentalEdgeApiFunctions();
        }
        const middlewareConfig = getMiddlewareConfig(page != null ? page : "middleware/edge API route", config, nextConfig);
        return {
            ssr,
            ssg,
            rsc,
            ...middlewareConfig && {
                middleware: middlewareConfig
            },
            ...runtime && {
                runtime
            }
        };
    }
    return {
        ssr: false,
        ssg: false,
        rsc: _constants1.RSC_MODULE_TYPES.server,
        runtime: (ref = nextConfig.experimental) == null ? void 0 : ref.runtime
    };
}

//# sourceMappingURL=get-page-static-info.js.map