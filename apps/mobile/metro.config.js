/**
 * Metro configuration for React Native with support for SVG files
 * https://github.com/react-native-svg/react-native-svg#use-with-svg-files
 *
 * @format
 */

const path = require('path');
const { getDefaultConfig } = require('metro-config')

const mobileRoot = path.resolve(__dirname)
const workspaceRoot = path.resolve(mobileRoot, '../..');

const watchFolders = [
  mobileRoot,
  `${workspaceRoot}/node_modules`,
  `${workspaceRoot}/packages`
]

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig()
  return {
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      // allows replacing .js|ts files with their .e2e.js|ts equivalent in Detox
      sourceExts: (process.env.RN_SRC_EXT || '')
        .split(',')
        .concat(sourceExts)
        .concat(['svg', 'cjs']),
      nodeModulesPaths: [`${workspaceRoot}/node_modules`],
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
