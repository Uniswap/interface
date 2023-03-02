/* eslint-env node */

const { readdirSync, statSync } = require('fs')
const path = require('path')

const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin')

/**
 * TODO(XXXX)
 * Vanilla Extract plugin that automatically configures Webpack loaders
 * https://vanilla-extract.style/documentation/integrations/next/
 */
const withVanillaExtract = createVanillaExtractPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * TODO(XXXX)
   * Next loads environmental variables from `.env` files automatically, but requires
   * them to be prefixed with `NEXT_PUBLIC_` to be exposed to the browser. Since we're sharing
   * the codebase with Create React App that uses `REACT_APP_` prefix, we need to manually
   * expose these variables.
   */
  env: {
    REACT_APP_AMPLITUDE_PROXY_URL: process.env.REACT_APP_AMPLITUDE_PROXY_URL,
    REACT_APP_STATSIG_PROXY_URL: process.env.REACT_APP_STATSIG_PROXY_URL,
    REACT_APP_AWS_API_REGION: process.env.REACT_APP_AWS_API_REGION,
    REACT_APP_AWS_API_ENDPOINT: process.env.REACT_APP_AWS_API_ENDPOINT,
    REACT_APP_TEMP_API_URL: process.env.REACT_APP_TEMP_API_URL,
    REACT_APP_SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
    REACT_APP_SENTRY_ENABLED: process.env.REACT_APP_SENTRY_ENABLED,
    ESLINT_NO_DEV_ERRORS: process.env.ESLINT_NO_DEV_ERRORS,
    REACT_APP_INFURA_KEY: process.env.REACT_APP_INFURA_KEY,
    REACT_APP_MOONPAY_API: process.env.REACT_APP_MOONPAY_API,
    REACT_APP_MOONPAY_LINK: process.env.REACT_APP_MOONPAY_LINK,
    REACT_APP_MOONPAY_PUBLISHABLE_KEY: process.env.REACT_APP_MOONPAY_PUBLISHABLE_KEY,
  },
  /**
   * TODO(XXXX)
   * Uniswap internal packages are currently packaged as a mix of CommonJS and ESModules. This causes
   * some incompatibilities, when a CommonJS package tries to require an ESModule and vice versa.
   * As a temporary workaround, we transpile the following packages with Babel to ensure they're all CommonJS.
   */
  transpilePackages: ['@uniswap/conedison', '@uniswap/widgets', '@uniswap/analytics', '@uniswap/analytics-events'],
  webpack(config) {
    /**
     * TODO(XXXX)
     * With Create React App, all folders in `src` can be imported without relative paths.
     * This is not the case with Next.js, so we need to manually configure Webpack to do so.
     */
    const topLevelFolders = readdirSync(path.resolve(__dirname, './src')).filter(
      (file) => statSync(path.join(__dirname, './src', file)).isDirectory() && file !== 'graphql'
    )
    topLevelFolders.push('graphql/data')
    topLevelFolders.push('graphql/thegraph')
    for (const folder of topLevelFolders) {
      config.resolve.alias[folder] = path.resolve(__dirname, './src', folder)
    }
    /**
     * SVG loaders are not included in Next.js by default, so we need to add them manually.
     * This allows to import them as React components.
     * See: https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/webpack.config.js#L389-L409
     */
    config.module.rules.push({
      test: /\.svg$/i,
      use: [
        {
          loader: require.resolve('@svgr/webpack'),
          options: {
            prettier: false,
            svgo: false,
            svgoConfig: {
              plugins: [{ removeViewBox: false }],
            },
            titleProp: true,
            ref: true,
          },
        },
        {
          loader: require.resolve('file-loader'),
          options: {
            name: 'static/media/[name].[hash].[ext]',
          },
        },
      ],
    })
    return config
  },
}

module.exports = withVanillaExtract(nextConfig)
