const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const now = Math.floor(new Date().getTime() / 1000)

module.exports = {
  webpack: {
    plugins: {
      add: process.env.SENTRY_AUTH_TOKEN
        ? [
            new SentryWebpackPlugin({
              // sentry-cli configuration
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              release: `${process.env.VERCEL_GIT_COMMIT_REF?.replace(/\//g, '--') ?? 'unknown'}-${
                process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown'
              }`,

              // webpack specific configuration
              include: './build/',
              ignore: ['node_modules'],
              setCommits: {
                repo: `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`,
                commit: process.env.VERCEL_GIT_COMMIT_SHA,
              },
              deploy: {
                env: process.env.VERCEL_ENV,
                url: `https://${process.env.VERCEL_URL}`,
                started: now,
              },
            }),
          ]
        : [],
    },
  },
  eslint: {
    enable: false,
  },
  typescript: { enableTypeChecking: false },
}
