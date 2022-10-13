"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.verifyTypeScriptSetup = verifyTypeScriptSetup;
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _path = _interopRequireDefault(require("path"));
var _hasNecessaryDependencies = require("./has-necessary-dependencies");
var _semver = _interopRequireDefault(require("next/dist/compiled/semver"));
var _compileError = require("./compile-error");
var _fatalError = require("./fatal-error");
var log = _interopRequireWildcard(require("../build/output/log"));
var _getTypeScriptIntent = require("./typescript/getTypeScriptIntent");
var _writeAppTypeDeclarations = require("./typescript/writeAppTypeDeclarations");
var _writeConfigurationDefaults = require("./typescript/writeConfigurationDefaults");
var _installDependencies = require("./install-dependencies");
var _ciInfo = require("../telemetry/ci-info");
var _missingDependencyError = require("./typescript/missingDependencyError");
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
const requiredPackages = [
    {
        file: "typescript/lib/typescript.js",
        pkg: "typescript",
        exportsRestrict: true
    },
    {
        file: "@types/react/index.d.ts",
        pkg: "@types/react",
        exportsRestrict: true
    },
    {
        file: "@types/node/index.d.ts",
        pkg: "@types/node",
        exportsRestrict: true
    }, 
];
async function verifyTypeScriptSetup({ dir , cacheDir , intentDirs , tsconfigPath , typeCheckPreflight , disableStaticImages  }) {
    const resolvedTsConfigPath = _path.default.join(dir, tsconfigPath);
    try {
        var ref;
        // Check if the project uses TypeScript:
        const intent = await (0, _getTypeScriptIntent).getTypeScriptIntent(dir, intentDirs, tsconfigPath);
        if (!intent) {
            return {
                version: null
            };
        }
        // Ensure TypeScript and necessary `@types/*` are installed:
        let deps = await (0, _hasNecessaryDependencies).hasNecessaryDependencies(dir, requiredPackages);
        if (((ref = deps.missing) == null ? void 0 : ref.length) > 0) {
            if (_ciInfo.isCI) {
                // we don't attempt auto install in CI to avoid side-effects
                // and instead log the error for installing needed packages
                await (0, _missingDependencyError).missingDepsError(dir, deps.missing);
            }
            console.log(_chalk.default.bold.yellow(`It looks like you're trying to use TypeScript but do not have the required package(s) installed.`) + "\n" + "Installing dependencies" + "\n\n" + _chalk.default.bold("If you are not trying to use TypeScript, please remove the " + _chalk.default.cyan("tsconfig.json") + " file from your package root (and any TypeScript files in your pages directory).") + "\n");
            await (0, _installDependencies).installDependencies(dir, deps.missing, true).catch((err)=>{
                if (err && typeof err === "object" && "command" in err) {
                    console.error(`Failed to install required TypeScript dependencies, please install them manually to continue:\n` + err.command + "\n");
                }
                throw err;
            });
            deps = await (0, _hasNecessaryDependencies).hasNecessaryDependencies(dir, requiredPackages);
        }
        // Load TypeScript after we're sure it exists:
        const ts = await Promise.resolve(require(deps.resolved.get("typescript")));
        if (_semver.default.lt(ts.version, "4.3.2")) {
            log.warn(`Minimum recommended TypeScript version is v4.3.2, older versions can potentially be incompatible with Next.js. Detected: ${ts.version}`);
        }
        // Reconfigure (or create) the user's `tsconfig.json` for them:
        await (0, _writeConfigurationDefaults).writeConfigurationDefaults(ts, resolvedTsConfigPath, intent.firstTimeSetup);
        // Write out the necessary `next-env.d.ts` file to correctly register
        // Next.js' types:
        await (0, _writeAppTypeDeclarations).writeAppTypeDeclarations(dir, !disableStaticImages);
        let result;
        if (typeCheckPreflight) {
            const { runTypeCheck  } = require("./typescript/runTypeCheck");
            // Verify the project passes type-checking before we go to webpack phase:
            result = await runTypeCheck(ts, dir, resolvedTsConfigPath, cacheDir);
        }
        return {
            result,
            version: ts.version
        };
    } catch (err) {
        // These are special errors that should not show a stack trace:
        if (err instanceof _compileError.CompileError) {
            console.error(_chalk.default.red("Failed to compile.\n"));
            console.error(err.message);
            process.exit(1);
        } else if (err instanceof _fatalError.FatalError) {
            console.error(err.message);
            process.exit(1);
        }
        throw err;
    }
}

//# sourceMappingURL=verifyTypeScriptSetup.js.map