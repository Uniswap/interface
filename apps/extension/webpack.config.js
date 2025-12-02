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

// if not set tamagui wont add nice data-at, data-in etc debug attributes
process.env.NODE_ENV = NODE_ENV

const isDevelopment = NODE_ENV === 'development'
const isProduction = NODE_ENV === 'production'
const appDirectory = path.resolve(__dirname)
const manifest = require('./src/manifest.json')

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
      devtool: 'cheap-module-source-map',
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

  // Title Postfix
  const EXTENSION_NAME_POSTFIX = BUILD_ENV === 'dev' ? 'DEV' : BUILD_ENV === 'beta' ? 'BETA' : ''

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
      chunkFilename: '[name].js',
      path: path.resolve(__dirname, dir),
      clean: true,
      publicPath: '',
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
                    disableExtraction: process.env.NODE_ENV === 'development',
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
      new DotenvPlugin({
        path: '../../.env',
        defaults: true,
      }),
      new DefinePlugin({
        __DEV__: NODE_ENV === 'development' ? 'true' : 'false',
        'process.env.IS_STATIC': '""',
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG || '0'),
        'process.env.VERSION': JSON.stringify(EXTENSION_VERSION),
        'process.env.IS_UNISWAP_EXTENSION': '"true"',
      }),
      new CleanWebpackPlugin(),
      new NodePolyfillPlugin(), // necessary to compile with reactnative-dotenv
      ...plugins,
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
                      : ['https://app.uniswap.org/*', 'https://ew.unihq.org/*', 'https://*.ew.unihq.org/*'],
                },
                // Ensure content scripts are registered in the webpack build (WXT handles this automatically).
                // These mirror the matches/runAt used in the TS entrypoints.
                content_scripts: [
                  {
                    id: 'injected',
                    matches: ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*'],
                    js: ['injected.js'],
                    run_at: 'document_start',
                  },
                  {
                    id: 'ethereum',
                    matches: ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*'],
                    js: ['ethereum.js'],
                    run_at: 'document_start',
                    // Ethereum provider must run in the MAIN world to attach to window.ethereum
                    world: 'MAIN',
                  },
                ],
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
            from: 'src/public/logo.svg',
            to: 'logo.svg',
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
