"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getParserOptions = getParserOptions;
exports.getJestSWCOptions = getJestSWCOptions;
exports.getLoaderSWCOptions = getLoaderSWCOptions;
const nextDistPath = /(next[\\/]dist[\\/]shared[\\/]lib)|(next[\\/]dist[\\/]client)|(next[\\/]dist[\\/]pages)/;
const regeneratorRuntimePath = require.resolve("next/dist/compiled/regenerator-runtime");
function getParserOptions({ filename , jsConfig , ...rest }) {
    var ref;
    const isTSFile = filename.endsWith(".ts");
    const isTypeScript = isTSFile || filename.endsWith(".tsx");
    const enableDecorators = Boolean(jsConfig == null ? void 0 : (ref = jsConfig.compilerOptions) == null ? void 0 : ref.experimentalDecorators);
    return {
        ...rest,
        syntax: isTypeScript ? "typescript" : "ecmascript",
        dynamicImport: true,
        decorators: enableDecorators,
        // Exclude regular TypeScript files from React transformation to prevent e.g. generic parameters and angle-bracket type assertion from being interpreted as JSX tags.
        [isTypeScript ? "tsx" : "jsx"]: !isTSFile,
        importAssertions: true
    };
}
function getBaseSWCOptions({ filename , jest , development , hasReactRefresh , globalWindow , nextConfig , resolvedBaseUrl , jsConfig , swcCacheDir , isServerLayer ,  }) {
    var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, ref10, ref11;
    const parserConfig = getParserOptions({
        filename,
        jsConfig
    });
    const paths = jsConfig == null ? void 0 : (ref = jsConfig.compilerOptions) == null ? void 0 : ref.paths;
    const enableDecorators = Boolean(jsConfig == null ? void 0 : (ref1 = jsConfig.compilerOptions) == null ? void 0 : ref1.experimentalDecorators);
    const emitDecoratorMetadata = Boolean(jsConfig == null ? void 0 : (ref2 = jsConfig.compilerOptions) == null ? void 0 : ref2.emitDecoratorMetadata);
    const useDefineForClassFields = Boolean(jsConfig == null ? void 0 : (ref3 = jsConfig.compilerOptions) == null ? void 0 : ref3.useDefineForClassFields);
    var ref12;
    const plugins = ((ref12 = nextConfig == null ? void 0 : (ref4 = nextConfig.experimental) == null ? void 0 : ref4.swcPlugins) != null ? ref12 : []).filter(Array.isArray).map(([name, options])=>[
            require.resolve(name),
            options
        ]);
    var ref13;
    return {
        jsc: {
            ...resolvedBaseUrl && paths ? {
                baseUrl: resolvedBaseUrl,
                paths
            } : {},
            externalHelpers: !process.versions.pnp && !jest,
            parser: parserConfig,
            experimental: {
                keepImportAssertions: true,
                plugins,
                cacheRoot: swcCacheDir
            },
            transform: {
                // Enables https://github.com/swc-project/swc/blob/0359deb4841be743d73db4536d4a22ac797d7f65/crates/swc_ecma_ext_transforms/src/jest.rs
                ...jest ? {
                    hidden: {
                        jest: true
                    }
                } : {},
                legacyDecorator: enableDecorators,
                decoratorMetadata: emitDecoratorMetadata,
                useDefineForClassFields: useDefineForClassFields,
                react: {
                    importSource: (ref13 = jsConfig == null ? void 0 : (ref5 = jsConfig.compilerOptions) == null ? void 0 : ref5.jsxImportSource) != null ? ref13 : (nextConfig == null ? void 0 : (ref6 = nextConfig.compiler) == null ? void 0 : ref6.emotion) ? "@emotion/react" : "react",
                    runtime: "automatic",
                    pragma: "React.createElement",
                    pragmaFrag: "React.Fragment",
                    throwIfNamespace: true,
                    development: !!development,
                    useBuiltins: true,
                    refresh: !!hasReactRefresh
                },
                optimizer: {
                    simplify: false,
                    globals: jest ? null : {
                        typeofs: {
                            window: globalWindow ? "object" : "undefined"
                        },
                        envs: {
                            NODE_ENV: development ? '"development"' : '"production"'
                        }
                    }
                },
                regenerator: {
                    importPath: regeneratorRuntimePath
                }
            }
        },
        sourceMaps: jest ? "inline" : undefined,
        styledComponents: getStyledComponentsOptions(nextConfig, development),
        removeConsole: nextConfig == null ? void 0 : (ref7 = nextConfig.compiler) == null ? void 0 : ref7.removeConsole,
        // disable "reactRemoveProperties" when "jest" is true
        // otherwise the setting from next.config.js will be used
        reactRemoveProperties: jest ? false : nextConfig == null ? void 0 : (ref8 = nextConfig.compiler) == null ? void 0 : ref8.reactRemoveProperties,
        modularizeImports: nextConfig == null ? void 0 : (ref9 = nextConfig.experimental) == null ? void 0 : ref9.modularizeImports,
        relay: nextConfig == null ? void 0 : (ref10 = nextConfig.compiler) == null ? void 0 : ref10.relay,
        emotion: getEmotionOptions(nextConfig, development),
        serverComponents: (nextConfig == null ? void 0 : (ref11 = nextConfig.experimental) == null ? void 0 : ref11.serverComponents) ? {
            isServer: !!isServerLayer
        } : false
    };
}
function getStyledComponentsOptions(nextConfig, development) {
    var ref;
    let styledComponentsOptions = nextConfig == null ? void 0 : (ref = nextConfig.compiler) == null ? void 0 : ref.styledComponents;
    if (!styledComponentsOptions) {
        return null;
    }
    var _displayName;
    return {
        ...styledComponentsOptions,
        displayName: (_displayName = styledComponentsOptions.displayName) != null ? _displayName : Boolean(development)
    };
}
function getEmotionOptions(nextConfig, development) {
    var ref, ref14, ref15, ref16, ref17, ref18, ref19;
    if (!(nextConfig == null ? void 0 : (ref = nextConfig.compiler) == null ? void 0 : ref.emotion)) {
        return null;
    }
    let autoLabel = false;
    switch(nextConfig == null ? void 0 : (ref14 = nextConfig.compiler) == null ? void 0 : (ref15 = ref14.emotion) == null ? void 0 : ref15.autoLabel){
        case "never":
            autoLabel = false;
            break;
        case "always":
            autoLabel = true;
            break;
        case "dev-only":
        default:
            autoLabel = !!development;
            break;
    }
    var ref20;
    return {
        enabled: true,
        autoLabel,
        labelFormat: nextConfig == null ? void 0 : (ref16 = nextConfig.compiler) == null ? void 0 : (ref17 = ref16.emotion) == null ? void 0 : ref17.labelFormat,
        sourcemap: development ? (ref20 = nextConfig == null ? void 0 : (ref18 = nextConfig.compiler) == null ? void 0 : (ref19 = ref18.emotion) == null ? void 0 : ref19.sourceMap) != null ? ref20 : true : false
    };
}
function getJestSWCOptions({ isServer , filename , esm , nextConfig , jsConfig , pagesDir ,  }) {
    let baseOptions = getBaseSWCOptions({
        filename,
        jest: true,
        development: false,
        hasReactRefresh: false,
        globalWindow: !isServer,
        nextConfig,
        jsConfig
    });
    const isNextDist = nextDistPath.test(filename);
    return {
        ...baseOptions,
        env: {
            targets: {
                // Targets the current version of Node.js
                node: process.versions.node
            }
        },
        module: {
            type: esm && !isNextDist ? "es6" : "commonjs"
        },
        disableNextSsg: true,
        disablePageConfig: true,
        pagesDir
    };
}
function getLoaderSWCOptions({ filename , development , isServer , isServerLayer , pagesDir , isPageFile , hasReactRefresh , nextConfig , jsConfig , supportedBrowsers , swcCacheDir ,  }) {
    let baseOptions = getBaseSWCOptions({
        filename,
        development,
        globalWindow: !isServer,
        hasReactRefresh,
        nextConfig,
        jsConfig,
        // resolvedBaseUrl,
        swcCacheDir,
        isServerLayer
    });
    const isNextDist = nextDistPath.test(filename);
    if (isServer) {
        return {
            ...baseOptions,
            // Disables getStaticProps/getServerSideProps tree shaking on the server compilation for pages
            disableNextSsg: true,
            disablePageConfig: true,
            isDevelopment: development,
            isServer,
            pagesDir,
            isPageFile,
            env: {
                targets: {
                    // Targets the current version of Node.js
                    node: process.versions.node
                }
            }
        };
    } else {
        // Matches default @babel/preset-env behavior
        baseOptions.jsc.target = "es5";
        return {
            ...baseOptions,
            // Ensure Next.js internals are output as commonjs modules
            ...isNextDist ? {
                module: {
                    type: "commonjs"
                }
            } : {},
            disableNextSsg: !isPageFile,
            isDevelopment: development,
            isServer,
            pagesDir,
            isPageFile,
            ...supportedBrowsers && supportedBrowsers.length > 0 ? {
                env: {
                    targets: supportedBrowsers
                }
            } : {}
        };
    }
}

//# sourceMappingURL=options.js.map