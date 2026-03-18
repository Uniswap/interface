const withStorybook = require('@storybook/react-native/metro/withStorybook');
const { mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config');

const defaultConfig = getExpoDefaultConfig(__dirname);

const {
  resolver: { sourceExts, assetExts },
} = defaultConfig;

// Only customize necessary fields for SVG and Storybook support
const customConfig = {
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'cjs'],
  },
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

const IS_STORYBOOK_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

module.exports = withStorybook(
  mergeConfig(getExpoDefaultConfig(__dirname), defaultConfig, customConfig),
  {
    enabled: IS_STORYBOOK_ENABLED,
    onDisabledRemoveStorybook: true,
    configPath: require('path').resolve(__dirname, './.storybook'),
  }
);
