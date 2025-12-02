import type { StorybookConfig } from '@storybook/react-webpack5'
import { dirname, join, resolve } from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import { DefinePlugin } from 'webpack'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  stories: [
    '../../../packages/ui/**/*.stories.?(ts|tsx)',
    '../../../packages/ui/**/*.mdx',
    '../../../packages/uniswap/src/**/*.stories.?(ts|tsx|js|jsx)',
    '../../../packages/uniswap/**/*.mdx',
  ],
  addons: [
    getAbsolutePath('@storybook/preset-create-react-app'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('storybook-addon-pseudo-states'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {},
  },
  staticDirs: ['../public'],
  webpackFinal: (config) => {
    // There are some conflicting ESLint rules that prevent storybook from building if this plugin is added to the Webpack configuration
    if (!config.plugins) {
      config.plugins = []
    }

    config.plugins = config.plugins.filter((plugin) => plugin?.constructor.name !== 'ESLintWebpackPlugin')

    config.plugins.push(
      new DefinePlugin({
        __DEV__: process.env.NODE_ENV === 'development',
        'process.env.IS_UNISWAP_EXTENSION': JSON.stringify(process.env.STORYBOOK_EXTENSION || 'false'),
      }),
    )

    // This modifies the existing image rule to exclude `.svg` files
    // since we handle those with `@svgr/webpack`.
    const imageRule =
      config?.module?.rules &&
      config.module.rules.find((rule) => {
        if (rule && typeof rule !== 'string' && rule.test instanceof RegExp) {
          return rule.test.test('.svg')
        }

        return
      })

    if (imageRule && typeof imageRule !== 'string') {
      imageRule.exclude = /\.svg$/i
    }

    config?.module?.rules &&
      config.module.rules.push({
        test: /\.svg$/i,
        use: ['@svgr/webpack'],
      })

    // Add babel-loader for TypeScript/JavaScript transpilation
    // @storybook/preset-create-react-app removes TypeScript rules
    config?.module?.rules &&
      config.module.rules.push({
        test: /\.(tsx?|jsx?)$/,
        // Exclude node_modules except for expo packages and related modules
        exclude: /node_modules\/(?!(expo-.*|@expo|@react-native|@uniswap\/.*)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
            cacheDirectory: true,
          },
        },
      })

    // Add babel-loader for React Native packages in node_modules
    config?.module?.rules &&
      config.module.rules.push({
        test: /\.(tsx?|jsx?)$/,
        // Exclude node_modules except for expo packages and related modules
        exclude: /node_modules\/(?!(expo-.*|@expo|@react-native|@uniswap\/.*)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
            cacheDirectory: true,
          },
        },
      })

    // Add babel-loader for React Native packages in node_modules
    config?.module?.rules &&
      config.module.rules.push({
        test: /\.(tsx?|jsx?)$/,
        include: [
          /node_modules\/react-native-reanimated/,
          /node_modules\/react-native-gesture-handler/,
          /node_modules\/@react-native/,
          /node_modules\/react-native\//,
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-typescript'],
            plugins: [],
            cacheDirectory: true,
          },
        },
      })

    config.resolve ??= {}

    // Configure resolve extensions to prefer .web files
    config.resolve.extensions = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js']

    // Add fallback for Node.js modules not available in browser
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      os: false,
      tty: require.resolve('./__mocks__/tty.js'),
      fs: false,
      path: false,
      util: false,
    }

    // Configure webpack aliases for React Native and compatibility
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config?.resolve?.alias,
        'react-native$': 'react-native-web',
        'expo-blur': require.resolve('./__mocks__/expo-blur.jsx'),
      },
    }

    config.resolve.modules = [resolve(__dirname, '../src'), 'node_modules']

    // Configure optimization - disable minimization in dev to prevent Storybook errors
    if (process.env.NODE_ENV === 'production') {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            parallel: 2, // Reduce from default (~8 CPU cores) to prevent memory exhaustion
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info'],
              },
              mangle: true,
              output: {
                comments: false,
              },
            },
            extractComments: false,
          }),
        ],
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
            },
            tamagui: {
              test: /[\\/]node_modules[\\/]tamagui[\\/]/,
              name: 'tamagui',
              priority: 20,
            },
            reactNative: {
              test: /[\\/]node_modules[\\/]react-native/,
              name: 'react-native',
              priority: 20,
            },
          },
          maxSize: 500000, // 500KB chunks to reduce memory footprint
        },
      }
    } else {
      // In development, explicitly disable minimization
      config.optimization = {
        ...config.optimization,
        minimize: false,
        minimizer: [],
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
            },
            tamagui: {
              test: /[\\/]node_modules[\\/]tamagui[\\/]/,
              name: 'tamagui',
              priority: 20,
            },
            reactNative: {
              test: /[\\/]node_modules[\\/]react-native/,
              name: 'react-native',
              priority: 20,
            },
          },
          maxSize: 500000,
        },
      }
    }

    // Disable source maps for production Storybook builds to save memory
    if (process.env.NODE_ENV === 'production') {
      config.devtool = false
    }

    // Remove ForkTsCheckerWebpackPlugin - it checks entire app, not just stories
    const tsCheckerPlugin =
      config.plugins && config.plugins.find((plugin) => plugin?.constructor.name === 'ForkTsCheckerWebpackPlugin')

    if (tsCheckerPlugin) {
      config.plugins = config.plugins?.filter((p) => p !== tsCheckerPlugin)
    }

    // Enable webpack persistent caching for faster rebuilds
    config.cache = {
      type: 'filesystem',
      cacheDirectory: resolve(__dirname, '../node_modules/.cache/storybook'),
      buildDependencies: {
        config: [__filename],
      },
    }

    // Configure performance hints
    config.performance = {
      maxAssetSize: 512000 * 2,
      maxEntrypointSize: 512000 * 2,
      hints: 'warning',
    }

    return config
  },
}
export default config
