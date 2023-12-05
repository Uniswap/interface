module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    ...(process.env.USE_FLIPPER ? {} : { 'react-native-flipper': { platforms: { ios: null } } }),
  },
}
