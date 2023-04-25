/* eslint-env node */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const { execSync } = require('child_process')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const { DefinePlugin, IgnorePlugin } = require('webpack')

const commitHash = execSync('git rev-parse HEAD').toString().trim()
const isProduction = process.env.NODE_ENV === 'production'

// Linting and type checking are only necessary as part of development and testing.
// Omit them from production builds, as they slow down the feedback loop.
const shouldLintOrTypeCheck = !isProduction

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
        cacheLocation: 'node_modules/.cache/eslint/',
        ignorePath: '.gitignore',
      })
    },
  },
  typescript: {
    enableTypeChecking: shouldLintOrTypeCheck,
  },
  jest: {
    configure(jestConfig) {
      return Object.assign(jestConfig, {
        transform: {
          '\\.css\\.ts$': './vanilla.transform.cjs',
          ...jestConfig.transform,
        },
        cacheDirectory: 'node_modules/.cache/jest',
        transformIgnorePatterns: ['@uniswap/conedison/format', '@uniswap/conedison/provider'],
        moduleNameMapper: {
          '@uniswap/conedison/format': '@uniswap/conedison/dist/format',
          '@uniswap/conedison/provider': '@uniswap/conedison/dist/provider',
        },
      })
    },
  },
  webpack: {
    plugins: [new VanillaExtractPlugin({ identifiers: 'short' })],
    configure: (webpackConfig) => {
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

          return plugin
        })
        .filter((plugin) => {
          // Case sensitive paths are enforced by TypeScript.
          // See https://www.typescriptlang.org/tsconfig#forceConsistentCasingInFileNames.
          if (plugin instanceof CaseSensitivePathsPlugin) return false

          // IgnorePlugin is used to tree-shake moment locales, but we do not use moment in this project.
          if (plugin instanceof IgnorePlugin) return false

          return true
        })

      // We're currently on Webpack 4.x which doesn't support the `exports` field in package.json.
      // Instead, we need to manually map the import path to the correct exports path (eg dist or build folder).
      // See https://github.com/webpack/webpack/issues/9509.
      webpackConfig.resolve.alias['@uniswap/conedison'] = '@uniswap/conedison/dist'

      return webpackConfig
    },
  },
}
