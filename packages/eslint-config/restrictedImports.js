exports.shared = {
  paths: [
    {
      name: 'utilities/src/telemetry/trace/Trace',
      message: "Please use the Trace in 'uniswap/src/features/telemetry/Trace' for app level usage!",
    },
    {
      name: 'utilities/src/telemetry/analytics/analytics',
      message:
        'Please only use this for initialization, tests, flushing, and internal usage. Otherwise use `packages/uniswap/src/features/telemetry`',
    },
    {
      name: '@uniswap/analytics',
      message: 'This is for internal use only. Please use `packages/uniswap/src/features/telemetry`',
    },
    {
      name: 'expo-localization',
      message:
        'Avoid using due to issue with unsupported locales. Use utilities/src/device/locales.ts getDeviceLocales instead',
    },
    {
      name: 'uniswap/src/features/dataApi/balances',
      importNames: ['usePortfolioValueModifiers'],
      message:
        'Use the wrapper hooks `usePortfolioTotalValue`, `useAccountList` or `usePortfolioBalances` instead of `usePortfolioValueModifiers` directly.',
    },
    {
      name: 'utilities/src/format/localeBased',
      message: 'Use via `useLocalizationContext` instead.',
    },
    {
      name: 'uniswap/src/features/fiatCurrency/conversion',
      importNames: ['useFiatConverter'],
      message: 'Use via `useLocalizationContext` instead.',
    },
    {
      name: 'uniswap/src/features/language/formatter',
      message: 'Use via `useLocalizationContext` instead.',
    },
  ],
  patterns: [
    {
      group: ['**/dist'],
      message: 'Do not import from dist/ - this is an implementation detail, and breaks tree-shaking.',
    },
  ],
}

exports.crossPlatform = {
  paths: [
    ...exports.shared.paths,
    {
      name: 'ethers',
      message: "Please import from '@ethersproject/module' directly to support tree-shaking.",
    },
    {
      name: 'ui/src/components/icons',
      message: "Please import icons directly from their respective files, e.g. `ui/src/components/icons/SpecificIcon`. This is to avoid importing the entire icons folder when only some icons are needed, which increases bundle size",
    },
    {
      name: 'ui/src/components/logos',
      message: "Please import logos directly from their respective files, e.g. `ui/src/components/logos/SpecificLogo`. This is to avoid importing the entire logos folder when only some logos are needed, which increases bundle size",
    },
  ],
  patterns: [
    ...exports.shared.patterns,
    {
      group: [
        '*react-native*',
        // The following are allowed to be imported in cross-platform code.
        '!react-native-reanimated',
        '!react-native-image-colors',
        '!@testing-library/react-native',
        '!@react-native-community/netinfo',
        '!react-native-localize',
      ],
      message:
        "React Native modules should not be imported outside of .native.ts files. If this is a .native.ts file, add an ignore comment to the top of the file. If you're trying to import a cross-platform module, add it to the whitelist in crossPlatform.js.",
    },
  ],
}
