// eslint-disable-next-line no-undef
module.exports = {
  eslint: {
    enable: false,
  },
  // eslint-disable-next-line no-undef
  ...(process.env.IS_CI
    ? {
        typescript: {
          enableTypeChecking: false,
        },
      }
    : {}),
}
