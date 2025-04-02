/* eslint-env node */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const { execSync } = require('child_process')
const { readFileSync } = require('fs')
const path = require('path')
const ModuleScopePlugin = require(path.resolve(__dirname, '..', '..','node_modules/react-dev-utils/ModuleScopePlugin'))
const { IgnorePlugin, ProvidePlugin, DefinePlugin } = require('webpack')
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const commitHash = execSync('git rev-parse HEAD').toString().trim()
const isProduction = process.env.NODE_ENV === 'production'
const isDev =  process.env.NODE_ENV === 'development'

process.env.REACT_APP_GIT_COMMIT_HASH = commitHash

// Static analyses (linting and type check) are only necessary as part of local development.
const enableStaticAnalysis = !process.env.CI && !isProduction

// Our .swcrc wasn't being picked up in the monorepo, so we load it directly.
const swcrc = JSON.parse(readFileSync('./.swcrc', 'utf-8'))

// Add all node modules that have to be compiled
const compileNodeModules = [
  // These libraries export JSX code from files with .js extension, which aren't transpiled
  // in the library to code that doesn't use JSX syntax. This file extension is not automatically
  // recognized as extension for files containing JSX, so we have to manually add them to
  // the build process (to the appropriate loader) and don't exclude them with other node_modules
  'expo-clipboard',
  'expo-linear-gradient',
  'expo-modules-core',
]

function getCacheDirectory(cacheName) {
  // Include the trailing slash to denote that this is a directory.
  return `${path.join(__dirname, 'node_modules/.cache/', cacheName)}/`
}

module.exports = {
  eslint: {
    enable: enableStaticAnalysis,
    pluginOptions(eslintConfig) {
      return Object.assign(eslintConfig, {
        cache: true,
        cacheLocation: getCacheDirectory('eslint'),
        ignorePath: '.gitignore',
        // Use our own eslint/plugins/config, as overrides interfere with caching.
        // This ensures that `yarn start` and `yarn lint` share one cache.
        eslintPath: require.resolve('eslint'),
        resolvePluginsRelativeTo: null,
        baseConfig: null,
      })
    },
  },
  typescript: {
    enableTypeChecking: enableStaticAnalysis,
  },
  jest: {
    configure(jestConfig) {
      return Object.assign(jestConfig, {
        globals: {
          __DEV__: true,
        },
        testTimeout: 15000,
        cacheDirectory: getCacheDirectory('jest'),
        transform: {
          ...Object.entries(jestConfig.transform).reduce((transform, [key, value]) => {
            if (value.match(/babel/)) {return transform}
            return { ...transform, [key]: value }
          }, {}),
          // Transform vanilla-extract using its own transformer.
          // See https://sandroroth.com/blog/vanilla-extract-cra#jest-transform.
          '\\.css\\.ts$': '@vanilla-extract/jest-transform',
          '\\.(t|j)sx?$': ['@swc/jest', swcrc],
        },
        // Use d3-arrays's build directly, as jest does not support its exports.
        transformIgnorePatterns: ['d3-array'],
        testPathIgnorePatterns: ['e2e'],
        moduleNameMapper: {
          'd3-array': '<rootDir>/../../node_modules/d3-array/dist/d3-array.min.js',
          '^react-native$': 'react-native-web',
          'react-native-gesture-handler': require.resolve('react-native-gesture-handler'),
        },
        setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      })
    },
  },
  webpack: {
    plugins: [
      new DefinePlugin({
        __DEV__: isDev,
        'process.env.EXPO_OS': '"web"',
      }),
      // Webpack 5 does not polyfill node globals, so we do so for those necessary:
      new ProvidePlugin({
        // - react-markdown requires process.cwd
        process: 'process/browser.js',
      }),
      new VanillaExtractPlugin(),
      new RetryChunkLoadPlugin({
        cacheBust: `function() {
          return 'cache-bust=' + Date.now();
        }`,
        // Retries with exponential backoff (500ms, 1000ms, 2000ms).
        retryDelay: `function(retryAttempt) {
          return 2 ** (retryAttempt - 1) * 500;
        }`,
        maxRetries: 3,
      }),
    ],
    configure: (webpackConfig) => {
      webpackConfig.resolve.extensions.unshift('.web.tsx')
      webpackConfig.resolve.extensions.unshift('.web.ts')
      webpackConfig.resolve.extensions.unshift('.web.js')

      if (isProduction) {
        // Configure bundle analysis based on environment variable
        const analyzerMode = process.env.UNISWAP_ANALYZE_BUNDLE_SIZE === 'static' ? 'static' : 'json'
        const analyzerConfig = {
          analyzerMode,
          ...(analyzerMode === 'static' && {
            reportFilename: 'report.html',
            openAnalyzer: true,
            generateStatsFile: true,
            statsFilename: 'webpack-stats.json'
          })
        }

        webpackConfig.plugins.push(new BundleAnalyzerPlugin(analyzerConfig))

        // Only include stats configuration if not in static analyzer mode
        if (process.env.UNISWAP_ANALYZE_BUNDLE_SIZE !== 'static') {
          webpackConfig.profile = true
          webpackConfig.stats = {
            usedExports: true,
            optimizationBailout: true,
            moduleTrace: true,
            reasons: true,
            chunks: true,
            modules: true,
          }
        }
      }

      // Configure webpack plugins:
      webpackConfig.plugins = webpackConfig.plugins
        .map((plugin) => {
          // CSS ordering is mitigated through scoping / naming conventions, so we can ignore order warnings.
          // See https://webpack.js.org/plugins/mini-css-extract-plugin/#remove-order-warnings.
          if (plugin.constructor.name == 'MiniCssExtractPlugin') {
            plugin.options.ignoreOrder = true
          }

          // Disable TypeScript's config overwrite, as it interferes with incremental build caching.
          // This ensures that `yarn start` and `yarn typecheck` share one cache.
          if (plugin.constructor.name == 'ForkTsCheckerWebpackPlugin') {
            delete plugin.options.typescript.configOverwrite
            plugin.options.typescript.build = true
          }

          return plugin
        })
        .filter((plugin) => {
          // Case sensitive paths are already enforced by TypeScript.
          // See https://www.typescriptlang.org/tsconfig#forceConsistentCasingInFileNames.
          if (plugin instanceof CaseSensitivePathsPlugin) {return false}

          // IgnorePlugin is used to tree-shake moment locales, but we do not use moment in this project.
          if (plugin instanceof IgnorePlugin) {return false}

          return true
        })

      // Configure webpack resolution:
      webpackConfig.resolve = Object.assign(webpackConfig.resolve, {
        alias: {
          ...webpackConfig.resolve.alias,
          '@web3-react/core': path.resolve(__dirname, 'src/connection/web3reactShim.ts'),
          crypto: require.resolve('expo-crypto'),
          'react-native-gesture-handler$': require.resolve('react-native-gesture-handler'),
          'react-native$': 'react-native-web',
        },
        plugins: webpackConfig.resolve.plugins.map((plugin) => {
          // Allow vanilla-extract in production builds.
          // This is necessary because create-react-app guards against external imports.
          // See https://sandroroth.com/blog/vanilla-extract-cra#production-build.
          if (plugin instanceof ModuleScopePlugin) {
            plugin.allowedPaths.push(path.join(__dirname, '..', '..', 'node_modules/@vanilla-extract/webpack-plugin'))
          }

          return plugin
        }),
        // Webpack 5 does not resolve node modules, so we do so for those necessary:
        fallback: {
          // - react-markdown requires path
          path: require.resolve('path-browserify'),
        },
      })

      // Retain source maps for node_modules packages:
      webpackConfig.module.rules[0] = {
        ...webpackConfig.module.rules[0],
        exclude: /node_modules/,
      }

      // Configure webpack transpilation (create-react-app specifies transpilation rules in a oneOf):
      webpackConfig.module.rules[1].oneOf = webpackConfig.module.rules[1].oneOf.map((rule) => {
        if (rule.loader && rule.loader.match(/babel-loader/)) {
          rule.loader = 'swc-loader'
          rule.options = swcrc

          rule.include = (inPath) => {
            // if not a node_module (except for the ones we want to compile)
            // we parse with SWC (so other packages in monorepo are importable)
            if (inPath.match(/node_modules/)) {
              return compileNodeModules.some((nodeModule) => inPath.includes(nodeModule))
            }
            return true
          }
        }
        return rule
      })

      // add tamagui compiler for web files
      // it does three stages (loaders run last to first):
      //   1. esbuild-loader just to strip types
      //   2. tamagui-loader optimizes and adds helpful dev data- attributes
      //   3. then swc finishes using our options
      webpackConfig.module.rules[1].oneOf.unshift({
        test: /.tsx?$/,
        exclude: (file) => file.includes('node_modules'),
        use: [
          // one after to remove the jsx
          {
            loader: 'swc-loader',
            options: swcrc
          },

          // tamagui optimizes the jsx
          {
            loader: 'tamagui-loader',
            options: {
              config: '../../packages/ui/src/tamagui.config.ts',
              components: ['ui'],
              // add files here that should be parsed by the compiler from within any of the apps/*
              // for example if you have constants.ts then constants.js goes here and it will eval them
              // at build time and if it can flatten views even if they use imports from that file
              importsWhitelist: ['constants.js'],
              disableExtraction: process.env.NODE_ENV === 'development',
            },
          },

          // one before just to remove types
          {
            loader: 'esbuild-loader',
            options: {
              target: 'es2022',
              jsx: 'preserve',
              minify: false,
            },
          },
        ],
      })

      // since wallet package uses react-native-dotenv and that needs a babel plugin
      // adding this before the swc loader
      webpackConfig.module.rules[1].oneOf.unshift({
        loader: 'babel-loader',
        include: (path) => /uniswap\/src.*\.(js|ts)x?$/.test(path),
        // Babel transpiles to cjs so any code that requires tree-shaking of it's dependencies
        // must be excluded here and processed by swc instead.
        // The downstream dependency that we need to be tree-shaken is listed next to each exclude.
        exclude: (path) => [
          'chains', // viem chains
          'transactions/swap/types', // uniswap sdks
          'data/rest', // connectrpc
          'i18n' // i18next
        ].some(p => path.includes(p)),
        options: {
          presets: ['module:@react-native/babel-preset'],
          plugins: [
            [
              'module:react-native-dotenv',
              {
                // ideally use envName here to add a mobile namespace but this doesn't work when sharing with dotenv-webpack
                moduleName: 'react-native-dotenv',
                path: '../../.env.defaults', // must use this path so this file can be shared with web since dotenv-webpack is less flexible
                safe: true,
                allowUndefined: false,
              },
            ],
          ],
        },
      })

      // TODO(WEB-3632): Tamagui linear gradient isn't fully-specified, temporary
      webpackConfig.module.rules.unshift({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      })

      // Run terser compression on node_modules before tree-shaking, so that tree-shaking is more effective.
      // This works by eliminating dead code, so that webpack can identify unused imports and tree-shake them;
      // it is only necessary for node_modules - it is done through linting for our own source code -
      // see https://medium.com/engineering-housing/dead-code-elimination-and-tree-shaking-at-housing-part-1-307a94b30f23#7e03:
      webpackConfig.module.rules.push({
        enforce: 'post',
        test: /node_modules.*\.(js)$/,
        loader: path.join(__dirname, 'scripts/terser-loader.js'),
        options: {
          compress: true,
          mangle: false,
        },
      })

      // Configure webpack optimization:
      webpackConfig.optimization = Object.assign(
        webpackConfig.optimization,
        isProduction
          ? {
              usedExports: true,
              sideEffects: true,
              // Optimize over all chunks, instead of async chunks (the default), so that initial chunks are also included.
              splitChunks: { chunks: 'all' },
            }
          : {}
      )

      if (isProduction) {
        webpackConfig.mode = 'production'
      }

      // Configure webpack resolution. webpackConfig.cache is unused with swc-loader, but the resolver can still cache:
      webpackConfig.resolve = Object.assign(webpackConfig.resolve, { unsafeCache: true })

      // Add rules to ignore `*.stories.*` and `*.mdx` files during the build process
      webpackConfig.module.rules.push({
        test: /\.stories\.[tj]sx?$|\.mdx$/,
        use: 'ignore-loader',
      })

      return webpackConfig
    },
  },
}
