const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { ProgressPlugin, ProvidePlugin, DefinePlugin } = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const fs = require('fs')
const DotenvPlugin = require('dotenv-webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const NODE_ENV = process.env.NODE_ENV || 'development'
const POLL_ENV = process.env.WEBPACK_POLLING_INTERVAL
const USE_NEW_CONFIGS = process.env.USE_NEW_CONFIGS === 'true'

// New unified config: read a single apps/extension/.env.new file. Other env sources are
// ignored. Fail fast so a missing or unreadable file aborts the build instead of
// silently producing a bundle with empty env values.
if (USE_NEW_CONFIGS) {
  const newEnvPath = path.resolve(__dirname, '.env.new')
  if (!fs.existsSync(newEnvPath)) {
    throw new Error(`USE_NEW_CONFIGS=true but ${newEnvPath} does not exist`)
  }
}

// if not set tamagui wont add nice data-at, data-in etc debug attributes
process.env.NODE_ENV = NODE_ENV
// Also required for Tamagui static extration
process.env.APP_ID = 'extension'

const isDevelopment = NODE_ENV === 'development'
const isProduction = NODE_ENV === 'production'
const appDirectory = path.resolve(__dirname)
const manifest = require('./src/manifest.json')

/**
 * Runs `scripts/validateBuildOutput.ts --webpack` after webpack finishes emitting. The
 * script scans every emitted `.js` file for bundler regressions that only surface at
 * runtime — primarily classic `importScripts(` worker chunk loading, which produces the
 * `chunks/chunks/<hash>.js` NetworkError that shipped in v1.73.0/v1.74.0. Throwing here
 * fails the webpack build, so CI catches it before the artifact uploads.
 */
class ValidateBuildOutputPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('ValidateBuildOutputPlugin', () => {
      const { execSync } = require('node:child_process')
      execSync('bun run scripts/validateBuildOutput.ts --webpack', {
        cwd: __dirname,
        stdio: 'inherit',
      })
    })
  }
}

// Add all node modules that have to be compiled
const compileNodeModules = [
  // These libraries export JSX code from files with .js extension, which aren't transpiled
  // in the library to code that doesn't use JSX syntax. This file extension is not automatically
  // recognized as extension for files containing JSX, so we have to manually add them to
  // the build proess (to the appropriate loader) and don't exclude them with other node_modules
  'expo-clipboard',
  'expo-linear-gradient',
  'react-native-image-picker',
  'expo-modules-core',
  'react-native-reanimated',
  // RN gesture-handler 2.28 ships some raw .ts sources alongside compiled .js (packaging regression);
  // route them through swc so webpack can parse TS-only syntax.
  'react-native-gesture-handler',
]

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being
// published. If you depend on uncompiled packages they may cause webpack build
// errors. To fix this webpack can be configured to compile to the necessary
// `node_module`.
const babelLoaderConfiguration = {
  test: /\.js$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    // path.resolve(appDirectory, "index.web.js"),
    // path.resolve(appDirectory, "src"),
    path.resolve(appDirectory, 'node_modules/react-native-uncompiled'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      // The 'babel-preset-expo' preset is recommended to match React Native's packager
      presets: ['babel-preset-expo'],
      // Re-write paths to import only the modules needed by the app
      plugins: ['react-native-web'],
    },
  },
}

const swcLoader = {
  loader: 'swc-loader',
  options: {
    // parseMap: true, // required when using with babel-loader
    env: {
      targets: require('./package.json').browserslist,
    },
    sourceMap: isDevelopment,
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
        dynamicImport: true,
      },
      transform: {
        react: {
          development: isDevelopment,
          refresh: isDevelopment,
        },
      },
    },
  },
}

const swcLoaderConfiguration = {
  test: ['.jsx', '.js', '.tsx', '.ts'].map((ext) => new RegExp(`${ext}$`)),
  exclude: new RegExp(`node_modules/(?!(${compileNodeModules.join('|')})/)`),
  use: swcLoader,
}

const fileExtensions = ['eot', 'gif', 'jpeg', 'jpg', 'otf', 'png', 'ttf', 'woff', 'woff2', 'mp4']

const {
  dir,
  plugins = [],
  ...extras
} = isDevelopment
  ? {
      dir: 'dev',
      watchOptions: {
        poll: POLL_ENV ? Number(POLL_ENV) : undefined,
      },
      devServer: {
        // watchFiles: ['src/**/*', 'webpack.config.js'],
        host: '127.0.0.1',
        port: 9997,
        server: fs.existsSync('localhost.pem')
          ? {
              type: 'https',
              options: {
                key: 'localhost-key.pem',
                cert: 'localhost.pem',
              },
            }
          : {},
        compress: false,
        hot: true, // Enable HMR
        static: {
          directory: path.join(__dirname, '../dev'),
        },
        client: {
          // logging: "info",
          progress: true,
          reconnect: true,
          overlay: {
            errors: true,
            warnings: false,
            // disable resize observer error
            // NOTE: ideally would use the function format (error) => boolean
            //       however, I was not able to get past CSP with that solution
            runtimeErrors: false,
          },
        },
        devMiddleware: {
          writeToDisk: true,
        },
      },
      devtool: 'inline-cheap-module-source-map',
      plugins: [new ReactRefreshWebpackPlugin()],
    }
  : {
      dir: 'build',
      plugins: [],
    }

module.exports = (env) => {
  // Build env is either 'dev', 'beta', or 'prod'
  if (!isDevelopment && env.BUILD_ENV !== 'prod' && env.BUILD_ENV !== 'beta' && env.BUILD_ENV !== 'dev') {
    throw new Error('Must set BUILD_ENV env variable to either prod, beta or dev')
  }

  // Build num is the fourth number in the extension version (<major>.<release>.<patch>.<build-num>). It will come from GH actions when building this to publish
  if (!isDevelopment && (env.BUILD_NUM === undefined || env.BUILD_NUM < 0)) {
    throw new Error('Must set BUILD_NUM env variable to a number >= 0')
  }

  const BUILD_ENV = env.BUILD_ENV
  const BUILD_NUM = env.BUILD_NUM || 0

  const publicAssetsVariant = isDevelopment
    ? 'local'
    : BUILD_ENV === 'dev'
      ? 'dev'
      : BUILD_ENV === 'beta'
        ? 'beta'
        : 'prod'

  // Title Postfix
  const EXTENSION_NAME_POSTFIX = isDevelopment
    ? 'LOCAL'
    : BUILD_ENV === 'dev'
      ? 'DEV'
      : BUILD_ENV === 'beta'
        ? 'BETA'
        : ''

  // Description
  let EXTENSION_DESCRIPTION = manifest.description
  if (BUILD_ENV === 'beta') {
    EXTENSION_DESCRIPTION = 'THIS EXTENSION IS FOR BETA TESTING'
  }
  if (BUILD_ENV === 'dev') {
    EXTENSION_DESCRIPTION = 'THIS EXTENSION IS FOR DEV TESTING'
  }

  // Version
  const EXTENSION_VERSION = manifest.version + '.' + BUILD_NUM

  return {
    mode: NODE_ENV,
    // Enables ESM output capability (prerequisite for `output.workerChunkLoading: 'import'` below).
    // Entries that don't opt in — background SW, content scripts, UI entries — remain classic scripts.
    experiments: {
      outputModule: true,
    },
    entry: {
      background: './src/entrypoints/background.ts',
      onboarding: './src/entrypoints/onboarding/main.tsx',
      loadSidebar: './src/entrypoints/sidepanel/loadSidebar.ts',
      sidebar: './src/entrypoints/sidepanel/main.tsx',
      injected: './src/entrypoints/injected.content.ts',
      ethereum: './src/entrypoints/ethereum.content.ts',
      popup: './src/entrypoints/fallback-popup/main.tsx',
      unitagClaim: './src/entrypoints/unitagClaim/main.tsx',
    },
    output: {
      filename: '[name].js',
      chunkFilename: 'chunks/[chunkhash].js',
      path: path.resolve(__dirname, dir),
      clean: true,
      publicPath: '',
      // Required: `experiments.outputModule: true` flips webpack's default IIFE wrapper off, leaking
      // top-level `var t, e; function r;` into the page global from MAIN-world content scripts.
      iife: true,
      // Web Workers in this extension are constructed with `new Worker(..., { type: 'module' })`
      // (see `src/workers/hashcashWorker.ts`). `workerChunkLoading: 'import'` makes webpack
      // emit native `import()` for any sub-chunks instead of the classic `importScripts(<url>)`
      // (which path-doubled under MV3 once `chunkFilename` put chunks under `chunks/`).
      // Requires `experiments.outputModule: true` above. This setting alone is not enough
      // when the worker has dependencies shared with the main bundle — see
      // `optimization.splitChunks` below.
      workerChunkLoading: 'import',
    },
    // Keep worker chunks self-contained.
    //
    // With `experiments.outputModule: true`, webpack emits shared dependency chunks in
    // ESM format (`export const id=753; export const modules={...}`), but the worker
    // entry chunk itself is still in classic array-push format
    // (`var t={...}; function n(e){...t[n](...)}`). Those two formats can't talk to
    // each other — the classic worker runtime calls into a factories registry that is
    // never assigned because the ESM loader that would bridge them isn't included in
    // the worker chunk. The worker throws `TypeError: r[e] is not a function` on the
    // first `require()` and idle-exits silently. No `error` event reaches the main
    // thread, so the parent's `bidc` channel waits forever.
    //
    // Excluding worker chunks from `splitChunks` forces webpack to inline every worker
    // dependency into the single worker entry, matching the shape WXT/Vite already
    // produce (a self-contained ~80KB file). The hashcash worker chunk is named via
    // the `webpackChunkName: "hashcash-worker"` magic comment in
    // `src/workers/hashcashWorker.ts`.
    optimization: {
      splitChunks: {
        chunks(chunk) {
          if (typeof chunk.name === 'string' && chunk.name.includes('worker')) {
            return false
          }
          // Default for everything else: split async chunks (webpack's default behavior).
          return chunk.canBeInitial() === false
        },
      },
    },
    // https://webpack.js.org/configuration/other-options/#level
    infrastructureLogging: { level: 'warn' },
    module: {
      rules: [
        // Use this rule together with other rules specified for the same pattern
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false, // disable the behaviour
          },
        },
        // Add immediate execution calls to entry point files
        {
          test: /\/(background|injected\.content|ethereum\.content)\.ts$/,
          use: [
            {
              loader: path.resolve(__dirname, 'webpack-plugins/immediate-execution-loader.js'),
            },
          ],
        },
        {
          oneOf: [
            {
              test: /\.(woff|woff2)$/,
              use: { loader: 'file-loader' },
            },

            {
              test: /\.css$/,
              use: [
                {
                  loader: 'style-loader',
                },
                {
                  loader: 'css-loader',
                },
              ],
            },

            {
              type: 'javascript/auto',
              test: /\.json$/,
              use: ['file-loader'],
              include: /tokenlist/,
            },

            // Used for creating SVG React components (similar to react=native-svg-transformer on mobile)
            {
              test: /\.svg$/,
              use: ['@svgr/webpack'],
            },

            {
              test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
              type: 'asset/resource',
            },

            {
              test: /.tsx?$/,
              exclude: (file) => file.includes('node_modules'),
              use: [
                // one after to remove the jsx
                swcLoader,

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
                    // TODO: test re-enabling extraction in production when #27138 merges
                    disableExtraction: true,
                  },
                },

                // one before to remove types
                {
                  loader: 'esbuild-loader',
                  options: {
                    target: 'es2022',
                    jsx: 'preserve',
                    minify: false,
                  },
                },
              ],
            },

            babelLoaderConfiguration,
            swcLoaderConfiguration,
          ],
        },
      ],
    },
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
        'react-native-reanimated$': require.resolve('react-native-reanimated'),
        'react-native-vector-icons$': 'react-native-vector-icons/dist',
        src: path.resolve(__dirname, 'src'), // absolute imports in apps/web
        'react-native-gesture-handler$': require.resolve('react-native-gesture-handler'),
        'expo-blur': require.resolve('./__mocks__/expo-blur.jsx'),
        'react-router': path.resolve(
          __dirname,
          isProduction
            ? '../../node_modules/react-router/dist/production/index.mjs'
            : '../../node_modules/react-router/dist/development/index.mjs',
        ),
      },
      // Add support for web-based extensions so we can share code between mobile/extension
      extensions: [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        ...fileExtensions.map((e) => `.${e}`),
        ...['.js', '.jsx', '.ts', '.tsx', '.css'],
      ],
      fallback: {
        fs: false,
      },
    },
    devtool: 'source-map',
    plugins: [
      new DotenvPlugin(
        USE_NEW_CONFIGS
          ? {
              // When USE_NEW_CONFIGS is on, read only apps/extension/.env.new.
              path: '.env.new',
              defaults: false,
            }
          : {
              path: '../../.env',
              defaults: true,
            },
      ),
      new DefinePlugin({
        __DEV__: NODE_ENV === 'development' ? 'true' : 'false',
        'process.env.IS_STATIC': '""',
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG || '0'),
        'process.env.VERSION': JSON.stringify(EXTENSION_VERSION),
        // process.env.APP_ID is used by @universe/config. When that package's
        // getConfig() function is removed, this define can be removed.
        'process.env.APP_ID': '"extension"',
      }),
      new CleanWebpackPlugin(),
      new NodePolyfillPlugin(), // necessary to compile with reactnative-dotenv
      ...plugins,
      // Post-emit scan for production builds — fails the build if any emitted JS contains
      // forbidden runtime patterns (e.g. `importScripts(` from classic worker chunk loading).
      // Skipped in dev to keep HMR rebuilds fast and because the bug class only manifests
      // when code-splitting kicks in for non-dev builds.
      ...(isProduction ? [new ValidateBuildOutputPlugin()] : []),
      new MiniCssExtractPlugin(),
      new ProgressPlugin(),
      new ProvidePlugin({
        process: 'process/browser',
        React: 'react',
        Buffer: ['buffer', 'Buffer'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/manifest.json',
            force: true,
            // oxlint-disable-next-line no-unused-vars -- biome-parity: oxlint is stricter here
            transform(content) {
              const transformedManifest = {
                ...manifest,
                description: EXTENSION_DESCRIPTION,
                version: EXTENSION_VERSION,
                name: EXTENSION_NAME_POSTFIX ? manifest.name + ' ' + EXTENSION_NAME_POSTFIX : manifest.name,
                externally_connectable: {
                  ...manifest.externally_connectable,
                  matches:
                    BUILD_ENV === 'prod'
                      ? ['https://app.uniswap.org/*']
                      : ['https://app.uniswap.org/*', 'https://app.corn-staging.com/*', 'https://dev.ew.unihq.org/*'],
                },
                // Ensure content scripts are registered in the webpack build (WXT handles this automatically).
                // These mirror the matches/runAt used in the TS entrypoints — localhost matches
                // only in local (isDevelopment) and dev builds, never in beta/prod.
                content_scripts: (() => {
                  const matches =
                    isDevelopment || BUILD_ENV === 'dev'
                      ? ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*']
                      : ['https://*/*']
                  return [
                    {
                      id: 'injected',
                      matches,
                      js: ['injected.js'],
                      run_at: 'document_start',
                      all_frames: true,
                    },
                    {
                      id: 'ethereum',
                      matches,
                      js: ['ethereum.js'],
                      run_at: 'document_start',
                      // Ethereum provider must run in the MAIN world to attach to window.ethereum
                      world: 'MAIN',
                      all_frames: true,
                    },
                  ]
                })(),
              }

              return Buffer.from(JSON.stringify(transformedManifest, null, 2))
            },
          },
          {
            from: 'src/public/assets/fonts/*.{woff,woff2,ttf}',
            to: 'assets/fonts/[name][ext]',
            force: true,
          },
          {
            from: 'src/public/assets/*.{png,svg}',
            to: 'assets/[name][ext]',
            force: true,
          },
          {
            from: `src/publicAssetsByEnv/${publicAssetsVariant}/*.{png,svg}`,
            to: 'assets/[name][ext]',
            force: true,
          },
          {
            from: 'src/entrypoints/sidepanel/index.html',
            to: 'sidepanel.html',
            force: true,
            transform(content) {
              return content.toString().replace('src="loadSidebar.ts"', 'src="loadSidebar.js"')
            },
          },
          {
            from: 'src/entrypoints/fallback-popup/index.html',
            to: 'fallback-popup.html',
            force: true,
            transform(content) {
              return content.toString().replace('src="main.tsx"', 'src="popup.js"')
            },
          },
          {
            from: 'src/entrypoints/onboarding/index.html',
            to: 'onboarding.html',
            force: true,
            transform(content) {
              return content.toString().replace('src="main.tsx"', 'src="onboarding.js"')
            },
          },
          {
            from: 'src/entrypoints/unitagClaim/index.html',
            to: 'unitagClaim.html',
            force: true,
            transform(content) {
              return content.toString().replace('src="main.tsx"', 'src="unitagClaim.js"')
            },
          },
        ],
      }),
    ],
    ...extras,
  }
}
