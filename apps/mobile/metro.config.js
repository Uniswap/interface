/**
 * Metro configuration for React Native with support for SVG files
 * https://github.com/react-native-svg/react-native-svg#use-with-svg-files
 *
 * @format
 */
const { getMetroAndroidAssetsResolutionFix } = require('react-native-monorepo-tools')
const androidAssetsResolutionFix = getMetroAndroidAssetsResolutionFix()

const withStorybook = require('@storybook/react-native/metro/withStorybook')

const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const mobileRoot = path.resolve(__dirname)
const workspaceRoot = path.resolve(mobileRoot, '../..')

const watchFolders = [mobileRoot, `${workspaceRoot}/node_modules`, `${workspaceRoot}/packages`]


const defaultConfig = getDefaultConfig(__dirname)

const {
  resolver: { sourceExts, assetExts },
} = defaultConfig

const config = {
  resolver: {
    nodeModulesPaths: [`${workspaceRoot}/node_modules`],
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'cjs'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    publicPath: androidAssetsResolutionFix.publicPath,
  },
  server: {
    enhanceMiddleware: (middleware) => {
      return androidAssetsResolutionFix.applyMiddleware(middleware)
    },
  },
  watchFolders,
}

const IS_STORYBOOK_ENABLED = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'

// Checkout more useful options in the docs: https://github.com/storybookjs/react-native?tab=readme-ov-file#options
module.exports = withStorybook(mergeConfig(defaultConfig, config), {
  // Set to false to remove storybook specific options
  // you can also use a env variable to set this
  enabled: IS_STORYBOOK_ENABLED,
  onDisabledRemoveStorybook: true,
  // Path to your storybook config
  configPath: path.resolve(__dirname, './.storybook'),
})
