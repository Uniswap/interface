const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { ProgressPlugin, ProvidePlugin, DefinePlugin } = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const fs = require("fs");
const { shouldExclude } = require('tamagui-loader')

const NODE_ENV = process.env.NODE_ENV || "development";
const EXTENSION_NAME =
  NODE_ENV === "development" ? "(DEV) Uniswap Wallet" : "Uniswap Wallet";

const isDevelopment = NODE_ENV === "development";
const appDirectory = path.resolve(__dirname);

const tamaguiOptions = {
  config: './tamagui.config.ts',
  components: ['@uniswap/ui', 'tamagui'],
  importsWhitelist: [],
  logTimings: true,
  disableExtraction: isDevelopment
}

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
    path.resolve(appDirectory, "node_modules/react-native-uncompiled"),
  ],
  use: {
    loader: "babel-loader",
    options: {
      cacheDirectory: true,
      // The 'metro-react-native-babel-preset' preset is recommended to match React Native's packager
      presets: ["module:metro-react-native-babel-preset"],
      // Re-write paths to import only the modules needed by the app
      plugins: ["react-native-web"],
    },
  },
};

const swcLoaderConfiguration = {
  test: [".jsx", ".js", ".tsx", ".ts"].map((ext) => new RegExp(`${ext}$`)),
  exclude: /node_modules/,
  use: {
    loader: "swc-loader",
    options: {
      // parseMap: true, // required when using with babel-loader
      env: {
        targets: require("./package.json").browserslist,
      },
      sourceMap: isDevelopment,
      jsc: {
        target: "es2022",
        parser: {
          syntax: "typescript",
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
  },
};

const tamaguiLoaderConfiguration = {
  loader: "tamagui-loader",
  options: {
    config: "./tamagui.config.ts",
    components: ["@uniswap/ui", "tamagui"],
  },
};

const fileExtensions = [
  "eot",
  "gif",
  "jpeg",
  "jpg",
  "otf",
  "png",
  "svg",
  "ttf",
  "woff",
  "woff2",
];

const {
  dir,
  plugins = [],
  ...extras
} = isDevelopment
  ? {
      dir: "dev",
      devServer: {
        // watchFiles: ['src/**/*', 'webpack.config.js'],
        host: "localhost",
        port: 9997,
        server: fs.existsSync("localhost.pem")
          ? {
              type: "https",
              options: {
                key: "localhost-key.pem",
                cert: "localhost.pem",
              },
            }
          : {},
        compress: false,
        static: {
          directory: path.join(__dirname, "../dev"),
        },
        client: {
          // logging: "info",
          progress: true,
          reconnect: false,
          overlay: {
            errors: true,
            warnings: false,
          },
        },
        devMiddleware: {
          writeToDisk: true,
        },
      },
      devtool: "cheap-module-source-map",
      plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new ReactRefreshWebpackPlugin(),
      ],
    }
  : {
      dir: "build",
      plugins: [new ForkTsCheckerWebpackPlugin()],
    };

const options = {
  mode: NODE_ENV,
  entry: {
    background: "./src/background/index.ts",
    // options: "./src/options/index.tsx",
    // permissions: "./src/permissions/index.tsx",
    popup: "./src/popup.tsx",
    // contentScript: "./src/contentScript/index.ts",
    // injected: "../provider-injection/dist/browser/index.js",
  },
  output: {
    filename: "[name].js",
    chunkFilename: "[name].js",
    path: path.resolve(__dirname, dir),
    clean: true,
    publicPath: "",
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false, // disable the behaviour
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
          },
        ],
      },
      {
        type: "javascript/auto",
        test: /\.json$/,
        use: ["file-loader"],
        include: /tokenlist/,
      },
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        type: "asset/resource",
        exclude: /node_modules/,
        loader: "file-loader",
        options: {
          name: "assets/[name].[ext]",
        },
      },
      babelLoaderConfiguration,
      swcLoaderConfiguration,
      // tamaguiLoaderConfiguration, // NOTE(peter) turned off for now bc it's not working with our webpack conifg. it's just an optimization compiler that we can configure later once i figure it out
    ],
  },
  resolve: {
    alias: {
      // // NOTE(peter): for whatever reason react is being installed in multiple places and breaking tamagui
      // // this was the best i could do to ensure it pulls the correct version until i figure out why. this is what's supposed to happen anyway
      // // if you find yourself here, run `ls node_modules/react` and if the folder exists, this stays, if it doesn't, you can safely remove
      react: path.resolve("../../node_modules/react"),
      "react-dom": path.resolve("../../node_modules/react-dom"),
      "react-native$": "react-native-web",
    },
    // Add support for web-based extensions so we can share code between mobile/extension
    extensions: [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ...fileExtensions.map((e) => `.${e}`),
      ...[".js", ".jsx", ".ts", ".tsx", ".css"],
    ],
    fallback: {
      buffer: require.resolve("buffer/"), // trailing slash is intentional
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
  },
  plugins: [
    new DefinePlugin({
      process: {
        env: {
          __DEV__: NODE_ENV === "development" ? "true" : "false",
          IS_STATIC: '""',
          NODE_ENV: JSON.stringify(NODE_ENV),
          TAMAGUI_TARGET: JSON.stringify("web"),
          DEBUG: JSON.stringify(process.env.DEBUG || "0"),
        },
      },
    }),
    new CleanWebpackPlugin(),
    ...plugins,
    new MiniCssExtractPlugin(),
    new ProgressPlugin(),
    new ProvidePlugin({
      process: "process/browser",
      React: "react",
      Buffer: ["buffer", "Buffer"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/manifest.json",
          force: true,
          transform: function (content, path) {
            return Buffer.from(
              JSON.stringify(
                {
                  description: process.env.npm_package_description,
                  version: process.env.npm_package_version,
                  name: EXTENSION_NAME,
                  ...JSON.parse(content.toString()),
                },
                null,
                2
              )
            );
          },
        },
        {
          from: "src/*.{html,png,svg}",
          to: "[name][ext]",
          force: true,
        },
        // {
        //   // use a different icon depending on the NODE_ENV
        //   from: `src/anchor-${NODE_ENV}.png`,
        //   to: "anchor.png",
        //   force: true,
        // },
        // {
        //   from: `src/assets/`,
        //   to: "assets/",
        //   force: true,
        // },
        // {
        //   from: "../provider-injection/dist/browser/index.js",
        //   to: "injected.js",
        //   force: true,
        // },
      ],
    }),
  ],
  ...extras,
};

module.exports = options;