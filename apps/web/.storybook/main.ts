import type { StorybookConfig } from '@storybook/react-webpack5'
import { DefinePlugin } from 'webpack'

import { dirname, join, resolve } from 'path'

const isDev = process.env.NODE_ENV === 'development'

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
        __DEV__: isDev,
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

    config?.module?.rules &&
      config.module.rules.push({
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      })

    config.resolve ??= {}

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config?.resolve?.alias,
        'react-native$': 'react-native-web',
      },
    }

    config.resolve.modules = [resolve(__dirname, '../src'), 'node_modules']

    return config
  },
}
export default config
