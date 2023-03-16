/* eslint-disable @typescript-eslint/no-explicit-any */

const config = {
  stories: ['../../../packages/ui/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    // 'storybook-addon-next-router',
    // "storybook-addon-next",
    {
      name: '@storybook/addon-react-native-web',
      options: {
        modulesToTranspile: [
          'solito',
          'react-native-web',
          'expo-linking',
          'expo-constants',
          'expo-modules-core',
          'react-i18next',
          'expo-document-picker',
          'expo-av',
          'expo-asset',
          // '@my/config',
        ],
        babelPlugins: [
          // "react-native-reanimated/plugin", // this breaks...
        ],
      },
    },
  ],
  core: {
    builder: 'webpack5',
  },
  framework: '@storybook/react',
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      // speeds up storybook build time
      allowSyntheticDefaultImports: false,
      // speeds up storybook build time
      esModuleInterop: false,
      // makes union prop types like variant and size appear as select controls
      shouldExtractLiteralValuesFromEnum: true,
      // makes string and boolean types that can be undefined appear as inputs and switches
      shouldRemoveUndefinedFromOptional: true,
      // Filter out third-party props from node_modules except @mui packages
      propFilter: (prop: any): boolean =>
        prop.parent
          ? !/node_modules\/(?!tamagui)/.test(prop.parent.fileName)
          : true,
    },
  },
  // managerWebpack: (config, options) => {
  //     options.cache.set = () => Promise.resolve();
  //     return config;
  // },
  webpackFinal: async (_config: any): Promise<any> => {
    // config.resolve = {
    //     ...config.resolve,
    //     fallback: {
    //         ...(config.resolve || {}).fallback,
    //         fs: false,
    //         stream: false,
    //         os: false,
    //     },
    // }
    // config.cache = {type: 'memory'}
    _config.module.rules.push({
      test: /\.(js|mjs|jsx)$/,
      resolve: {
        fullySpecified: false,
      },
    })

    // config.resolve.plugins = config.resolve.plugins || []
    // config.resolve.plugins.push(
    //   new TsconfigPathsPlugin({
    //     configFile: path.resolve(__dirname, '../tsconfig.json'),
    //   })
    // )
    return _config
  },
  env: (_config: any): any => ({
    ..._config,
    TAMAGUI_TARGET: 'web',
  }),
}
export default config
