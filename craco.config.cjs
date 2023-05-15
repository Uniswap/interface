/* eslint-env node */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const { execSync } = require('child_process')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const { DefinePlugin, IgnorePlugin, ProvidePlugin } = require('webpack')

const commitHash = execSync('git rev-parse HEAD').toString().trim()
const isProduction = process.env.NODE_ENV === 'production'

// Linting and type checking are only necessary as part of development and testing.
// Omit them from production builds, as they slow down the feedback loop.
const shouldLintOrTypeCheck = !isProduction

function getCacheDirectory(cacheName) {
  // Include the trailing slash to denote that this is a directory.
  return `${path.join(__dirname, 'node_modules/.cache/', cacheName)}/`
}

module.exports = {
  babel: {
    plugins: [
      '@vanilla-extract/babel-plugin',
      ...(process.env.REACT_APP_ADD_COVERAGE_INSTRUMENTATION
        ? [
            [
              'istanbul',
              {
                all: true,
                include: ['src/**/*.tsx', 'src/**/*.ts'],
                exclude: [
                  'src/**/*.css',
                  'src/**/*.css.ts',
                  'src/**/*.test.ts',
                  'src/**/*.test.tsx',
                  'src/**/*.spec.ts',
                  'src/**/*.spec.tsx',
                  'src/**/graphql/**/*',
                  'src/**/*.d.ts',
                ],
              },
            ],
          ]
        : []),
    ],
  },
  eslint: {
    enable: shouldLintOrTypeCheck,
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
    enableTypeChecking: shouldLintOrTypeCheck,
  },
  jest: {
    configure(jestConfig) {
      return Object.assign(jestConfig, {
        cacheDirectory: getCacheDirectory('jest'),
        transform: Object.assign(jestConfig.transform, {
          // Transform vanilla-extract using its own transformer.
          // See https://sandroroth.com/blog/vanilla-extract-cra#jest-transform.
          '\\.css\\.ts$': '@vanilla-extract/jest-transform',
        }),
        // Use @uniswap/conedison's build directly, as jest does not support its exports.
        transformIgnorePatterns: ['@uniswap/conedison/format', '@uniswap/conedison/provider'],
        moduleNameMapper: {
          '@uniswap/conedison/format': '@uniswap/conedison/dist/format',
          '@uniswap/conedison/provider': '@uniswap/conedison/dist/provider',
        },
      })
    },
  },
  webpack: {
    plugins: [
      // Webpack 5 does not polyfill node globals, so we do so for those necessary:
      new ProvidePlugin({
        // - react-markdown requires process.cwd
        process: 'process/browser',
      }),
      // vanilla-extract has poor performance on M1 machines with 'debug' identifiers, so we use 'short' instead.
      // See https://vanilla-extract.style/documentation/integrations/webpack/#identifiers for docs.
      // See https://github.com/vanilla-extract-css/vanilla-extract/issues/771#issuecomment-1249524366.
      new VanillaExtractPlugin({ identifiers: 'short' }),
    ],
    configure: (webpackConfig) => {
      // Configure webpack plugins:
      webpackConfig.plugins = webpackConfig.plugins
        .map((plugin) => {
          // Extend process.env with dynamic values (eg commit hash).
          // This will make dynamic values available to JavaScript only, not to interpolated HTML (ie index.html).
          if (plugin instanceof DefinePlugin) {
            Object.assign(plugin.definitions['process.env'], {
              REACT_APP_GIT_COMMIT_HASH: JSON.stringify(commitHash),
            })
          }

          // CSS ordering is mitigated through scoping / naming conventions, so we can ignore order warnings.
          // See https://webpack.js.org/plugins/mini-css-extract-plugin/#remove-order-warnings.
          if (plugin instanceof MiniCssExtractPlugin) {
            plugin.options.ignoreOrder = true
          }

          // Disable TypeScript's config overwrite, as it interferes with incremental build caching.
          // This ensures that `yarn start` and `yarn typecheck` share one cache.
          if (plugin.constructor.name == 'ForkTsCheckerWebpackPlugin') {
            delete plugin.options.typescript.configOverwrite
          }

          return plugin
        })
        .filter((plugin) => {
          // Case sensitive paths are already enforced by TypeScript.
          // See https://www.typescriptlang.org/tsconfig#forceConsistentCasingInFileNames.
          if (plugin instanceof CaseSensitivePathsPlugin) return false

          // IgnorePlugin is used to tree-shake moment locales, but we do not use moment in this project.
          if (plugin instanceof IgnorePlugin) return false

          return true
        })

      // Configure webpack resolution:
      webpackConfig.resolve = Object.assign(webpackConfig.resolve, {
        plugins: webpackConfig.resolve.plugins.map((plugin) => {
          // Allow vanilla-extract in production builds.
          // This is necessary because create-react-app guards against external imports.
          // See https://sandroroth.com/blog/vanilla-extract-cra#production-build.
          if (plugin instanceof ModuleScopePlugin) {
            plugin.allowedPaths.push(path.join(__dirname, 'node_modules/@vanilla-extract/webpack-plugin'))
          }

          return plugin
        }),
        // Webpack 5 does not resolve node modules, so we do so for those necessary:
        fallback: {
          // - react-markdown requires path
          path: require.resolve('path-browserify'),
        },
      })

      // Configure webpack transpilation (create-react-app specifies transpilation rules in a oneOf):
      webpackConfig.module.rules[1].oneOf = webpackConfig.module.rules[1].oneOf.map((rule) => {
        // The fallback rule (eg for dependencies).
        if (rule.loader && rule.loader.match(/babel-loader/) && !rule.include) {
          // Allow not-fully-specified modules so that legacy packages are still able to build.
          rule.resolve = { fullySpecified: false }

          // The class properties transform is required for @uniswap/analytics to build.
          rule.options.plugins.push('@babel/plugin-proposal-class-properties')
        }
        return rule
      })

      // Configure webpack optimization:
      webpackConfig.optimization = Object.assign(
        webpackConfig.optimization,
        isProduction
          ? {
              splitChunks: {
                // Cap the chunk size to 5MB.
                // react-scripts suggests a chunk size under 1MB after gzip, but we can only measure maxSize before gzip.
                // react-scripts also caps cacheable chunks at 5MB, which gzips to below 1MB, so we cap chunk size there.
                // See https://github.com/facebook/create-react-app/blob/d960b9e/packages/react-scripts/config/webpack.config.js#L713-L716.
                maxSize: 5 * 1024 * 1024,
                // Optimize over all chunks, instead of async chunks (the default), so that initial chunks are also optimized.
                chunks: 'all',
              },
            }
          : {}
      )

      // Configure webpack caching:
      webpackConfig.cache = Object.assign(webpackConfig.cache, {
        cacheDirectory: getCacheDirectory('webpack'),
      })

      // Ignore failed source mappings to avoid spamming the console.
      // Source mappings for a package will fail if the package does not provide them, but the build will still succeed,
      // so it is unnecessary (and bothersome) to log it. This should be turned off when debugging missing sourcemaps.
      // See https://webpack.js.org/loaders/source-map-loader#ignoring-warnings.
      webpackConfig.ignoreWarnings = [/Failed to parse source map/]

      return webpackConfig
    },
  },
}
