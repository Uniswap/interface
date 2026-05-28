// TODO(apps-infra): Remove this file once this package replaces jest with vitest
// Jest should be the only tool still using it.
module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV)
  return {
    presets: ['babel-preset-expo'],
  }
}
