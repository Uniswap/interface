/**
 * Metro configuration for React Native with support for SVG files
 * https://github.com/react-native-svg/react-native-svg#use-with-svg-files
 *
 * @format
 */

const path = require('path')
const { getDefaultConfig } = require('metro-config')

const mobileRoot = path.resolve(__dirname)
const workspaceRoot = path.resolve(mobileRoot, '../..')

const watchFolders = [mobileRoot, `${workspaceRoot}/node_modules`, `${workspaceRoot}/packages`]

const iosExtensions = ['ios.js', 'ios.jsx', 'ios.ts', 'ios.tsx']

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig()
  return {
    resolver: {
      nodeModulesPaths: [`${workspaceRoot}/node_modules`],
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, ...iosExtensions, 'svg', 'cjs'],
    },
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    watchFolders,
  }
})()
