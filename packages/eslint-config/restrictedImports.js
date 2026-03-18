// Rules that should apply to all cases
const sharedRules = {
  paths: [
    {
      name: '@tamagui/core',
      message: "Please import from 'tamagui' directly to prevent mismatches.",
    },
    {
      name: '@uniswap/sdk-core',
      importNames: ['ChainId'],
      message: "Don't use ChainId from @uniswap/sdk-core. Use the UniverseChainId from universe/uniswap.",
    },
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
      importNames: ['sendAnalyticsEvent'],
      message: "Please use the typed `sendAnalyticsEvent` in  'uniswap/src/features/telemetry/send'?",
    },
    {
      name: 'expo-localization',
      message:
        'Avoid using due to issue with unsupported locales. Use utilities/src/device/locales.ts getDeviceLocales instead',
    },
    {
      name: 'uniswap/src/features/dataApi/balances/balances',
      importNames: ['usePortfolioValueModifiers'],
      message:
        'Use the wrapper hooks `usePortfolioTotalValue`, `useAccountListData` or `usePortfolioBalances` instead of `usePortfolioValueModifiers` directly.',
    },
    {
      name: 'uniswap/src/features/dataApi/balances/balancesRest',
      importNames: ['useRESTPortfolioTotalValue'],
      message:
        'Use the wrapper hooks `usePortfolioTotalValue`, `useAccountListData` or `usePortfolioBalances` instead of `useRESTPortfolioTotalValue` directly.',
    },
    {
      name: 'i18next',
      importNames: ['t'],
      message:
        'Please avoid direct imports of t, using `useTranslation` and `i18n.t` when absolutely needed outside of a React context',
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
      importNames: ['useLocalizedFormatter'],
      message: 'Use via `useLocalizationContext` instead.',
    },
    {
      name: 'uniswap/src/features/chains/hooks/useOrderedChainIds',
      importNames: ['useOrderedChainIds'],
      message: 'Use `useEnabledChains` instead, which returns the ordered chains that are currently enabled.',
    },
    {
      name: 'ui/src/hooks/useDeviceInsets',
      importNames: ['useDeviceInsets'],
      message: 'Use `useAppInsets` instead.',
    },
    {
      name: 'react-native-device-info',
      importNames: ['getUniqueId'],
      message: 'Not supported for web/extension, use `getUniqueId` from `utilities/src/device/getUniqueId` instead.',
    },
    {
      name: 'lodash',
      message:
        "Use specific imports (e.g. `import isEqual from 'lodash/isEqual'`) to avoid pulling in all of lodash to web to keep bundle size down!",
    },
    {
      name: 'uniswap/src/features/chains/chainInfo',
      importNames: ['UNIVERSE_CHAIN_INFO'],
      message: 'Use useChainInfo or helpers in packages/uniswap/src/features/chains/utils.ts when possible!',
    },
    {
      name: 'uniswap/src/features/settings/selectors',
      importNames: ['selectIsTestnetModeEnabled'],
      message: 'Use `useEnabledChains` instead.',
    },
    {
      name: 'api/src/clients/graphql/__generated__/react-hooks',
      importNames: ['useAccountListQuery'],
      message: 'Use `useAccountListData` instead.',
    },
    {
      name: 'api/src/clients/graphql/__generated__/react-hooks',
      importNames: ['usePortfolioBalancesQuery'],
      message: 'Use `usePortfolioBalances` instead.',
    },
    {
      name: 'wallet/src/data/apollo/usePersistedApolloClient',
      importNames: ['usePersistedApolloClient'],
      message:
        "This hook should only be used once at the top level where the React app is initialized . You can use `import { useApolloClient } from '@apollo/client'` to get the default apollo client from the provider elsewhere in React. If you need access to apollo outside of React, you can use `import { apolloClientRef } from 'wallet/src/data/apollo/usePersistedApolloClient''`.",
    },
    {
      name: 'statsig-react',
      message: 'Import from internal module uniswap/src/features/gating instead',
    },
    {
      name: 'wallet/src/components/ErrorBoundary/restart',
      message: 'Use `wallet/src/components/ErrorBoundary/restartApp` instead.',
    },
  ],
  patterns: [
    {
      group: ['ui/src/assets/icons/*.svg'],
      message:
        'Please do not import SVG files directly from `ui/src/assets/icons/*.svg`. Use generated icon components instead, e.g., `ui/src/components/icons/{iconName}`.',
    },
  ],
}

// Rules that should apply to native code only
const nativeRules = {
  paths: [
    // Shared rules
    ...sharedRules.paths,
    // Should attempt sharing in the future
    {
      name: '@ethersproject',
      message: "Please import from 'ethers' directly to support tree-shaking.",
    },
    // Native specific packages/restrictions
    {
      name: 'statsig-react-native',
      message: 'Import from internal module uniswap/src/features/gating instead',
    },
    {
      name: 'react-native-safe-area-context',
      importNames: ['useSafeAreaInsets'],
      message: 'Use our internal `useAppInsets` hook instead.',
    },
    {
      name: 'react-native',
      importNames: ['Switch'],
      message: 'Use our custom Switch component instead.',
    },
    {
      name: 'react-native',
      importNames: ['Keyboard'],
      message:
        'Please use dismissNativeKeyboard() instead for dismissals. addListener is okay to ignore this import for!',
    },
    {
      name: '@gorhom/bottom-sheet',
      importNames: ['BottomSheetTextInput'],
      message: 'Use our internal `BottomSheetTextInput` wrapper from `/uniswap/src/components/modals/Modal`.',
    },
    {
      name: 'expo-haptics',
      message:
        "Use our internal `HapticFeedback` wrapper instead: `import { HapticFeedback } from 'packages/uniswap/src/features/settings/useHapticFeedback/types'`",
    },
    {
      name: 'react-router',
      message: 'Do not import react-router in native code. Use react-navigation instead.',
    },
  ],
  patterns: sharedRules.patterns,
}

const reactNativeRuleMessage =
  "React Native modules should not be imported outside of .native.ts files unless they are only types (import type { ... }). If the file isn't used outside of native usage, add it to the excluded files in webPlatform.js."

const reactNative = {
  patterns: [
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
      allowTypeImports: true,
      message: reactNativeRuleMessage,
    },
  ],
}

// Rules that should apply to any code that's run on the web (interface) platform
const webPlatformRules = {
  // paths: [],
  // patterns: [],
  paths: [
    ...sharedRules.paths,
    {
      name: 'ethers',
      message: "Please import from '@ethersproject/module' directly to support tree-shaking.",
    },
    {
      name: 'ui/src/components/icons',
      message:
        'Please import icons directly from their respective files, e.g. `ui/src/components/icons/SpecificIcon`. This is to avoid importing the entire icons folder when only some icons are needed, which increases bundle size',
    },
    {
      name: 'ui/src/components/modal/AdaptiveWebModal',
      message:
        'Please import Modal from `uniswap/src/components/modals/Modal` instead. Modal uses AdaptiveWebModal under the hood but has extra logic for handling animation, mounting, and dismounting.',
    },
  ],
  patterns: [...sharedRules.patterns, ...reactNative.patterns],
}

const extensionRules = {
  paths: [
    // Allow general icon path in extension
    ...webPlatformRules.paths.filter((p) => p.name !== 'ui/src/components/icons'),
  ],
  patterns: [
    // Remove react native rules for extension
    ...webPlatformRules.patterns.filter((p) => p.message !== reactNativeRuleMessage),
  ],
}

// Rules that should apply to the web interface only
const interfaceRules = {
  paths: [
    ...webPlatformRules.paths,
    {
      name: '@playwright/test',
      message: 'Import test and expect from playwright/fixtures instead.',
      importNames: ['test', 'expect'],
    },
    {
      name: 'i18next',
      importNames: ['i18n'],
      message: 'Import from `uniswap/src/i18n` instead.',
    },
    {
      name: 'styled-components',
      message: 'Styled components is deprecated, please use Flex or styled from "ui/src" instead.',
    },
    {
      name: 'api/src/clients/graphql/__generated__/react-hooks',
      importNames: ['useActivityWebQuery'],
      message: 'Import cached/subscription-based activity hooks from `AssetActivityProvider` instead.',
    },
    {
      name: '@uniswap/smart-order-router',
      message: 'Only import types, unless you are in the client-side SOR, to preserve lazy-loading.',
      allowTypeImports: true,
    },
    {
      name: 'moment',
      // tree-shaking for moment is not configured because it degrades performance - see craco.config.cjs.
      message: 'moment is not configured for tree-shaking. If you use it, update the Webpack configuration.',
    },
    {
      name: 'react-helmet-async',
      // default package's esm export is broken, but the explicit cjs export works.
      message: `Import from 'react-helmet-async/lib/index' instead.`,
    },
    {
      name: 'zustand',
      importNames: ['default'],
      message: 'Default import from zustand is deprecated. Import `{ create }` instead.',
    },
    {
      name: 'utilities/src/platform',
      importNames: ['isIOS', 'isAndroid'],
      message: 'Importing isIOS and isAndroid from platform is not allowed. Use isWebIOS and isWebAndroid instead.',
    },
    {
      name: 'wagmi',
      importNames: ['useChainId', 'useAccount', 'useConnect', 'useDisconnect', 'useBlockNumber', 'useWatchBlockNumber'],
      message:
        'Import wrapped utilities from internal hooks instead: useAccount from `hooks/useAccount`, useConnect from `hooks/useConnect`, useDisconnect from `hooks/useDisconnect`, useBlockNumber from `hooks/useBlockNumber`.',
    },
  ],
  patterns: webPlatformRules.patterns,
}

// Universal
exports.shared = sharedRules

// Platform
exports.native = nativeRules
exports.webPlatform = webPlatformRules
exports.reactNative = reactNative

// App Specific
exports.interface = interfaceRules
exports.extension = extensionRules
