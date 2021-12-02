const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const now = Math.floor(new Date().getTime() / 1000)

module.exports = {
  webpack: {
    configure: (config) => {
      if (process.env.SENTRY_AUTH_TOKEN) {
        config.plugins.push(
          new SentryWebpackPlugin({
            // sentry-cli configuration
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            release:
              process.env.REACT_APP_SENTRY_RELEASE ??
              `${
                process.env.VERCEL_GIT_COMMIT_REF ? process.env.VERCEL_GIT_COMMIT_REF.replace(/\//g, '--') : 'unknown'
              }-${process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA : 'unknown'}`,

            // webpack specific configuration
            include: './build/',
            ignore: ['node_modules'],
            setCommits: {
              repo: process.env.GITHUB_REPO,
              commit: process.env.GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA,
            },
            deploy: {
              env: process.env.REACT_APP_SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV,
              url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
              started: now,
            },
          })
        )
      }
      return config
    },
  },
  eslint: {
    enable: false,
  },
  typescript: { enableTypeChecking: false },
}
