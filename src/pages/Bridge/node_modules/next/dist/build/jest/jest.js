"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = nextJest;
var _env = require("@next/env");
var _path = require("path");
var _config = _interopRequireDefault(require("../../server/config"));
var _constants = require("../../shared/lib/constants");
var _loadJsconfig = _interopRequireDefault(require("../load-jsconfig"));
var Log = _interopRequireWildcard(require("../output/log"));
var _findPagesDir = require("../../lib/find-pages-dir");
var _swc = require("../swc");
function nextJest(options = {}) {
    // createJestConfig
    return (customJestConfig)=>{
        // Function that is provided as the module.exports of jest.config.js
        // Will be called and awaited by Jest
        return async ()=>{
            let nextConfig;
            let jsConfig;
            let resolvedBaseUrl;
            let isEsmProject = false;
            let pagesDir;
            if (options.dir) {
                const resolvedDir = (0, _path).resolve(options.dir);
                pagesDir = (0, _findPagesDir).findPagesDir(resolvedDir).pages;
                const packageConfig = loadClosestPackageJson(resolvedDir);
                isEsmProject = packageConfig.type === "module";
                nextConfig = await getConfig(resolvedDir);
                (0, _env).loadEnvConfig(resolvedDir, false, Log);
                // TODO: revisit when bug in SWC is fixed that strips `.css`
                const result = await (0, _loadJsconfig).default(resolvedDir, nextConfig);
                jsConfig = result.jsConfig;
                resolvedBaseUrl = result.resolvedBaseUrl;
            }
            var ref;
            // Ensure provided async config is supported
            const resolvedJestConfig = (ref = typeof customJestConfig === "function" ? await customJestConfig() : customJestConfig) != null ? ref : {};
            // eagerly load swc bindings instead of waiting for transform calls
            await (0, _swc).loadBindings();
            if (_swc.lockfilePatchPromise.cur) {
                await _swc.lockfilePatchPromise.cur;
            }
            return {
                ...resolvedJestConfig,
                moduleNameMapper: {
                    // Handle CSS imports (with CSS modules)
                    // https://jestjs.io/docs/webpack#mocking-css-modules
                    "^.+\\.module\\.(css|sass|scss)$": require.resolve("./object-proxy.js"),
                    // Handle CSS imports (without CSS modules)
                    "^.+\\.(css|sass|scss)$": require.resolve("./__mocks__/styleMock.js"),
                    // Handle image imports
                    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp)$": require.resolve(`./__mocks__/fileMock.js`),
                    // Keep .svg to it's own rule to make overriding easy
                    "^.+\\.(svg)$": require.resolve(`./__mocks__/fileMock.js`),
                    // custom config comes last to ensure the above rules are matched,
                    // fixes the case where @pages/(.*) -> src/pages/$! doesn't break
                    // CSS/image mocks
                    ...resolvedJestConfig.moduleNameMapper || {}
                },
                testPathIgnorePatterns: [
                    // Don't look for tests in node_modules
                    "/node_modules/",
                    // Don't look for tests in the Next.js build output
                    "/.next/",
                    // Custom config can append to testPathIgnorePatterns but not modify it
                    // This is to ensure `.next` and `node_modules` are always excluded
                    ...resolvedJestConfig.testPathIgnorePatterns || [], 
                ],
                transform: {
                    // Use SWC to compile tests
                    "^.+\\.(js|jsx|ts|tsx|mjs)$": [
                        require.resolve("../swc/jest-transformer"),
                        {
                            nextConfig,
                            jsConfig,
                            resolvedBaseUrl,
                            isEsmProject,
                            pagesDir
                        }, 
                    ],
                    // Allow for appending/overriding the default transforms
                    ...resolvedJestConfig.transform || {}
                },
                transformIgnorePatterns: [
                    // To match Next.js behavior node_modules is not transformed
                    "/node_modules/",
                    // CSS modules are mocked so they don't need to be transformed
                    "^.+\\.module\\.(css|sass|scss)$",
                    // Custom config can append to transformIgnorePatterns but not modify it
                    // This is to ensure `node_modules` and .module.css/sass/scss are always excluded
                    ...resolvedJestConfig.transformIgnorePatterns || [], 
                ],
                watchPathIgnorePatterns: [
                    // Don't re-run tests when the Next.js build output changes
                    "/.next/",
                    ...resolvedJestConfig.watchPathIgnorePatterns || [], 
                ]
            };
        };
    };
}
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
async function getConfig(dir) {
    const conf = await (0, _config).default(_constants.PHASE_TEST, dir);
    return conf;
}
/**
 * Loads closest package.json in the directory hierarchy
 */ function loadClosestPackageJson(dir, attempts = 1) {
    if (attempts > 5) {
        throw new Error("Can't resolve main package.json file");
    }
    var mainPath = attempts === 1 ? "./" : Array(attempts).join("../");
    try {
        return require((0, _path).join(dir, mainPath + "package.json"));
    } catch (e) {
        return loadClosestPackageJson(dir, attempts + 1);
    }
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=jest.js.map