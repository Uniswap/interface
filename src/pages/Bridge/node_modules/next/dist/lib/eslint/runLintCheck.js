"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.runLintCheck = runLintCheck;
var _fs = require("fs");
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _path = _interopRequireDefault(require("path"));
var _findUp = _interopRequireDefault(require("next/dist/compiled/find-up"));
var _semver = _interopRequireDefault(require("next/dist/compiled/semver"));
var CommentJson = _interopRequireWildcard(require("next/dist/compiled/comment-json"));
var _customFormatter = require("./customFormatter");
var _writeDefaultConfig = require("./writeDefaultConfig");
var _hasEslintConfiguration = require("./hasEslintConfiguration");
var _writeOutputFile = require("./writeOutputFile");
var _constants = require("../constants");
var _findPagesDir = require("../find-pages-dir");
var _installDependencies = require("../install-dependencies");
var _hasNecessaryDependencies = require("../has-necessary-dependencies");
var Log = _interopRequireWildcard(require("../../build/output/log"));
var _isError = _interopRequireWildcard(require("../is-error"));
var _getPkgManager = require("../helpers/get-pkg-manager");
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
// 0 is off, 1 is warn, 2 is error. See https://eslint.org/docs/user-guide/configuring/rules#configuring-rules
const VALID_SEVERITY = [
    "off",
    "warn",
    "error"
];
function isValidSeverity(severity) {
    return VALID_SEVERITY.includes(severity);
}
const requiredPackages = [
    {
        file: "eslint",
        pkg: "eslint",
        exportsRestrict: false
    },
    {
        file: "eslint-config-next",
        pkg: "eslint-config-next",
        exportsRestrict: false
    }, 
];
async function cliPrompt() {
    console.log(_chalk.default.bold(`${_chalk.default.cyan("?")} How would you like to configure ESLint? https://nextjs.org/docs/basic-features/eslint`));
    try {
        const cliSelect = (await Promise.resolve(require("next/dist/compiled/cli-select"))).default;
        const { value  } = await cliSelect({
            values: _constants.ESLINT_PROMPT_VALUES,
            valueRenderer: ({ title , recommended  }, selected)=>{
                const name = selected ? _chalk.default.bold.underline.cyan(title) : title;
                return name + (recommended ? _chalk.default.bold.yellow(" (recommended)") : "");
            },
            selected: _chalk.default.cyan("\u276F "),
            unselected: "  "
        });
        return {
            config: value == null ? void 0 : value.config
        };
    } catch  {
        return {
            config: null
        };
    }
}
async function lint(baseDir, lintDirs, eslintrcFile, pkgJsonPath, hasAppDir, { lintDuringBuild =false , eslintOptions =null , reportErrorsOnly =false , maxWarnings =-1 , formatter =null , outputFile =null  }) {
    try {
        var ref, ref1;
        // Load ESLint after we're sure it exists:
        const deps = await (0, _hasNecessaryDependencies).hasNecessaryDependencies(baseDir, requiredPackages);
        const packageManager = (0, _getPkgManager).getPkgManager(baseDir);
        if (deps.missing.some((dep)=>dep.pkg === "eslint")) {
            Log.error(`ESLint must be installed${lintDuringBuild ? " in order to run during builds:" : ":"} ${_chalk.default.bold.cyan((packageManager === "yarn" ? "yarn add --dev" : packageManager === "pnpm" ? "pnpm install --save-dev" : "npm install --save-dev") + " eslint")}`);
            return null;
        }
        const mod = await Promise.resolve(require(deps.resolved.get("eslint")));
        const { ESLint  } = mod;
        var ref2;
        let eslintVersion = (ref2 = ESLint == null ? void 0 : ESLint.version) != null ? ref2 : mod == null ? void 0 : (ref = mod.CLIEngine) == null ? void 0 : ref.version;
        if (!eslintVersion || _semver.default.lt(eslintVersion, "7.0.0")) {
            return `${_chalk.default.red("error")} - Your project has an older version of ESLint installed${eslintVersion ? " (" + eslintVersion + ")" : ""}. Please upgrade to ESLint version 7 or above`;
        }
        let options = {
            useEslintrc: true,
            baseConfig: {},
            errorOnUnmatchedPattern: false,
            extensions: [
                ".js",
                ".jsx",
                ".ts",
                ".tsx"
            ],
            cache: true,
            ...eslintOptions
        };
        let eslint = new ESLint(options);
        let nextEslintPluginIsEnabled = false;
        const nextRulesEnabled = new Map();
        const pagesDirRules = [
            "@next/next/no-html-link-for-pages"
        ];
        for (const configFile of [
            eslintrcFile,
            pkgJsonPath
        ]){
            var ref3;
            if (!configFile) continue;
            const completeConfig = await eslint.calculateConfigForFile(configFile);
            if ((ref3 = completeConfig.plugins) == null ? void 0 : ref3.includes("@next/next")) {
                nextEslintPluginIsEnabled = true;
                for (const [name, [severity]] of Object.entries(completeConfig.rules)){
                    if (!name.startsWith("@next/next/")) {
                        continue;
                    }
                    if (typeof severity === "number" && severity >= 0 && severity < VALID_SEVERITY.length) {
                        nextRulesEnabled.set(name, VALID_SEVERITY[severity]);
                    } else if (typeof severity === "string" && isValidSeverity(severity)) {
                        nextRulesEnabled.set(name, severity);
                    }
                }
                break;
            }
        }
        const pagesDir = (0, _findPagesDir).findPagesDir(baseDir, hasAppDir).pages;
        if (nextEslintPluginIsEnabled) {
            let updatedPagesDir = false;
            for (const rule of pagesDirRules){
                var ref4, ref5;
                if (!((ref4 = options.baseConfig.rules) == null ? void 0 : ref4[rule]) && !((ref5 = options.baseConfig.rules) == null ? void 0 : ref5[rule.replace("@next/next", "@next/babel-plugin-next")])) {
                    if (!options.baseConfig.rules) {
                        options.baseConfig.rules = {};
                    }
                    options.baseConfig.rules[rule] = [
                        1,
                        pagesDir
                    ];
                    updatedPagesDir = true;
                }
            }
            if (updatedPagesDir) {
                eslint = new ESLint(options);
            }
        } else {
            Log.warn("The Next.js plugin was not detected in your ESLint configuration. See https://nextjs.org/docs/basic-features/eslint#migrating-existing-config");
        }
        const lintStart = process.hrtime();
        let results = await eslint.lintFiles(lintDirs);
        let selectedFormatter = null;
        if (options.fix) await ESLint.outputFixes(results);
        if (reportErrorsOnly) results = await ESLint.getErrorResults(results) // Only return errors if --quiet flag is used
        ;
        if (formatter) selectedFormatter = await eslint.loadFormatter(formatter);
        const formattedResult = (0, _customFormatter).formatResults(baseDir, results, selectedFormatter == null ? void 0 : selectedFormatter.format);
        const lintEnd = process.hrtime(lintStart);
        const totalWarnings = results.reduce((sum, file)=>sum + file.warningCount, 0);
        if (outputFile) await (0, _writeOutputFile).writeOutputFile(outputFile, formattedResult.output);
        return {
            output: formattedResult.outputWithMessages,
            isError: ((ref1 = ESLint.getErrorResults(results)) == null ? void 0 : ref1.length) > 0 || maxWarnings >= 0 && totalWarnings > maxWarnings,
            eventInfo: {
                durationInSeconds: lintEnd[0],
                eslintVersion: eslintVersion,
                lintedFilesCount: results.length,
                lintFix: !!options.fix,
                nextEslintPluginVersion: nextEslintPluginIsEnabled && deps.resolved.has("eslint-config-next") ? require(_path.default.join(_path.default.dirname(deps.resolved.get("eslint-config-next")), "package.json")).version : null,
                nextEslintPluginErrorsCount: formattedResult.totalNextPluginErrorCount,
                nextEslintPluginWarningsCount: formattedResult.totalNextPluginWarningCount,
                nextRulesEnabled: Object.fromEntries(nextRulesEnabled)
            }
        };
    } catch (err) {
        if (lintDuringBuild) {
            Log.error(`ESLint: ${(0, _isError).default(err) && err.message ? err.message.replace(/\n/g, " ") : err}`);
            return null;
        } else {
            throw (0, _isError).getProperError(err);
        }
    }
}
async function runLintCheck(baseDir, lintDirs, opts) {
    const { lintDuringBuild =false , eslintOptions =null , reportErrorsOnly =false , maxWarnings =-1 , formatter =null , outputFile =null , strict =false , hasAppDir ,  } = opts;
    try {
        var ref;
        // Find user's .eslintrc file
        // See: https://eslint.org/docs/user-guide/configuring/configuration-files#configuration-file-formats
        const eslintrcFile = (ref = await (0, _findUp).default([
            ".eslintrc.js",
            ".eslintrc.cjs",
            ".eslintrc.yaml",
            ".eslintrc.yml",
            ".eslintrc.json",
            ".eslintrc", 
        ], {
            cwd: baseDir
        })) != null ? ref : null;
        var ref6;
        const pkgJsonPath = (ref6 = await (0, _findUp).default("package.json", {
            cwd: baseDir
        })) != null ? ref6 : null;
        let packageJsonConfig = null;
        if (pkgJsonPath) {
            const pkgJsonContent = await _fs.promises.readFile(pkgJsonPath, {
                encoding: "utf8"
            });
            packageJsonConfig = CommentJson.parse(pkgJsonContent);
        }
        const config = await (0, _hasEslintConfiguration).hasEslintConfiguration(eslintrcFile, packageJsonConfig);
        let deps;
        if (config.exists) {
            // Run if ESLint config exists
            return await lint(baseDir, lintDirs, eslintrcFile, pkgJsonPath, hasAppDir, {
                lintDuringBuild,
                eslintOptions,
                reportErrorsOnly,
                maxWarnings,
                formatter,
                outputFile
            });
        } else {
            // Display warning if no ESLint configuration is present inside
            // config file during "next build", no warning is shown when
            // no eslintrc file is present
            if (lintDuringBuild) {
                if (config.emptyPkgJsonConfig || config.emptyEslintrc) {
                    Log.warn(`No ESLint configuration detected. Run ${_chalk.default.bold.cyan("next lint")} to begin setup`);
                }
                return null;
            } else {
                // Ask user what config they would like to start with for first time "next lint" setup
                const { config: selectedConfig  } = strict ? _constants.ESLINT_PROMPT_VALUES.find((opt)=>opt.title === "Strict") : await cliPrompt();
                if (selectedConfig == null) {
                    // Show a warning if no option is selected in prompt
                    Log.warn("If you set up ESLint yourself, we recommend adding the Next.js ESLint plugin. See https://nextjs.org/docs/basic-features/eslint#migrating-existing-config");
                    return null;
                } else {
                    // Check if necessary deps installed, and install any that are missing
                    deps = await (0, _hasNecessaryDependencies).hasNecessaryDependencies(baseDir, requiredPackages);
                    if (deps.missing.length > 0) await (0, _installDependencies).installDependencies(baseDir, deps.missing, true);
                    // Write default ESLint config.
                    // Check for /pages and src/pages is to make sure this happens in Next.js folder
                    if ((0, _findPagesDir).existsSync(_path.default.join(baseDir, "pages")) || (0, _findPagesDir).existsSync(_path.default.join(baseDir, "src/pages"))) {
                        await (0, _writeDefaultConfig).writeDefaultConfig(baseDir, config, selectedConfig, eslintrcFile, pkgJsonPath, packageJsonConfig);
                    }
                }
                Log.ready(`ESLint has successfully been configured. Run ${_chalk.default.bold.cyan("next lint")} again to view warnings and errors.`);
                return null;
            }
        }
    } catch (err) {
        throw err;
    }
}

//# sourceMappingURL=runLintCheck.js.map