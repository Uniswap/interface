module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '*react-native*',
              '!react-native-image-colors', // Allow importing react-native-image-colors, since it is cross platform.
            ],
            message:
              "React Native modules should not be imported outside of .native.ts files. If this is a .native.ts file, add an ignore comment to the top of the file. If you're trying to import a cross-platform module, add it to the whitelist in crossPlatform.js.",
          },
        ],
      },
    ],
  },
}
