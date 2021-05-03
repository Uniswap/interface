// eslint-disable-next-line no-undef
module.exports = process.env.IS_CI
  ? {
      eslint: {
        enable: false,
      },
      typescript: {
        enableTypeChecking: false,
      },
    }
  : {}
