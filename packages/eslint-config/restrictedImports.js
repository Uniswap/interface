exports.shared = {
  paths: [
    {
      name: 'utilities/src/telemetry/trace/Trace',
      message: "Please use the Trace in 'uniswap/src/features/telemetry/Trace' for app level usage!",
    },
  ],
  patterns: [],
}

exports.crossPlatform = {
  paths: [
    ...exports.shared.paths,
    {
      name: 'ethers',
      message: "Please import from '@ethersproject/module' directly to support tree-shaking.",
    },
  ],
  patterns: [
    ...exports.shared.patterns,
    {
      group: [
        '*react-native*',
        '!react-native-image-colors', // Allow importing react-native-image-colors, since it is cross platform.
      ],
      message:
        "React Native modules should not be imported outside of .native.ts files. If this is a .native.ts file, add an ignore comment to the top of the file. If you're trying to import a cross-platform module, add it to the whitelist in crossPlatform.js.",
    },
    {
      group: ['**/dist'],
      message: 'Do not import from dist/ - this is an implementation detail, and breaks tree-shaking.',
    },
  ],
}
