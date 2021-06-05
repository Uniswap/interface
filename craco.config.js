const SentryWebpackPlugin = require('@sentry/webpack-plugin')

module.exports = {
  eslint: {
    enable: false,
  },
  ...(process.env.IS_CI
    ? {
        typescript: {
          enableTypeChecking: false,
        },
      }
    : {}),
  webpack: {
    plugins: {
      add: process.env.SENTRY_AUTH_TOKEN
        ? [
            new SentryWebpackPlugin({
              // sentry-cli configuration
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: 'ubelabs',
              project: 'ubeswap-interface',
              release: `${process.env.REACT_APP_VERCEL_GIT_COMMIT_REF?.replace(/\//g, '--') ?? 'unknown'}-${
                process.env.REACT_APP_VERCEL_GIT_COMMIT_SHA ?? 'unknown'
              }`,

              // webpack specific configuration
              include: './build/',
              ignore: ['node_modules'],
            }),
          ]
        : [],
    },
  },
}
