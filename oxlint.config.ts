import { defineConfig } from 'oxlint'

export const isFastLint = process.env.ENABLE_FAST_LINT === 'true'

// Absolute path required: relative jsPlugin paths don't resolve when the config
// is loaded from a different working directory.
const rootDir = new URL('.', import.meta.url).pathname

export const rootIgnorePatterns = [
  'oxlint.config.ts',
  'tsconfig.json',
  '*.tsbuildinfo',
  '.bun/**',
  '.tamagui/**',
  '@types/**',
  'types/**',
  '**/lcov-report/**',
  '**/coverage/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/bin/**',
  '**/scripts/**',
  '**/__generated__/**',
  '**/__mocks__/**',
  '**/.next/**',
  '**/.react-router/**',
  '**/.source/**',
  '**/.maestro/**',
  '**/.storybook/storybook.requires.ts',
  '**/babel.*',
  '**/vite.*',
  '**/vitest.config*',
  '**/vitest-setup*',
  '**/vitest-package-mocks*',
  '**/jest-setup*',
  '**/jest-package-mocks*',
  '**/webpack.*',
  '**/webpack-plugins/**',
  '**/.wxt/**',
  '**/wxt.config.*',
  '**/tailwind-config.*',
  // ── apps/mobile ──
  'apps/mobile/metro.config.js',
  'apps/mobile/ReactotronConfig.ts',
  'apps/mobile/index.js',
  'apps/mobile/.storybook/**',
  'apps/mobile/src/polyfills/**',
  // ── apps/web ──
  'apps/web/src/setupTests.ts',
  'apps/web/playwright/**',
  'apps/web/cypress/**',
  'apps/web/public/**',
  'apps/web/functions/**',
  'apps/web/vite/**',
  'apps/web/twist-configs/**',
  'apps/web/test-results/**',
  'apps/web/.storybook/**',
  'apps/web/**/test-utils/**/*',
  'apps/web/**/*.config.*',
  'apps/web/**/*.d.ts',
  // ── apps/extension ──
  'apps/extension/dev/**',
  'apps/extension/webpack*.js',
  'apps/extension/jest*.js',
  'apps/extension/babel*.js',
  // ── apps/dev-portal ──
  'apps/dev-portal/functions/**',
  // ── apps/mission-control ──
  'apps/mission-control/vite*.ts',
  // ── packages/uniswap ──
  'packages/uniswap/src/abis/types/**',
  'packages/uniswap/vite/**',
  'packages/uniswap/vitest*.ts',
  'packages/uniswap/jest*.js',
  'packages/uniswap/babel*.js',
  // ── packages/wallet ──
  'packages/wallet/jest*.js',
  'packages/wallet/babel*.js',
  // ── packages/ui ──
  'packages/ui/src/components/icons/**',
  'packages/ui/src/components/logos/**',
  // ── packages/api ──
  'packages/api/codegen.ts',
  // ── tools/uniswap-nx ──
  'tools/uniswap-nx/src/generators/**/files/**',
]

// ── Shared no-restricted-imports definitions ──────────────────────────
// Used in per-project overrides that customize no-restricted-imports.
// When a project override redefines no-restricted-imports, oxlint replaces the
// root definition entirely — so the override must spread these arrays.
export const sharedRestrictedImportPaths = [
  {
    name: 'utilities/src/telemetry/analytics/analytics',
    message:
      'Please only use this for initialization, tests, flushing, and internal usage. Otherwise use `packages/uniswap/src/features/telemetry`',
  },
  {
    name: 'utilities/src/telemetry/trace/Trace',
    message: "Please use the Trace in 'uniswap/src/features/telemetry/Trace' for app level usage!",
  },
  {
    name: 'ui/src/components/modal/AdaptiveWebModal',
    message:
      'Please import Modal from `uniswap/src/components/modals/Modal` instead. Modal uses AdaptiveWebModal under the hood but has extra logic for handling animation, mounting, and dismounting.',
  },
  {
    name: 'react-native',
    importNames: ['Switch', 'Keyboard'],
    message:
      'Use our custom Switch component instead of Switch. Please use dismissNativeKeyboard() for keyboard dismissals.',
  },
  {
    name: 'ui/src/hooks/useDeviceInsets',
    importNames: ['useDeviceInsets'],
    message: 'Use `useAppInsets` instead.',
  },
  {
    name: 'react-native-safe-area-context',
    importNames: ['useSafeAreaInsets'],
    message: 'Use our internal useAppInsets hook instead.',
  },
  {
    name: 'react-native-device-info',
    importNames: ['getUniqueId'],
    message: 'Not supported for web/extension, use `getUniqueId` from `utilities/src/device/getUniqueId` instead.',
  },
  {
    name: 'react-native-dotenv',
    message: 'Do not import env vars from react-native-dotenv. Use getConfig() instead.',
  },
  {
    name: 'wallet/src/data/apollo/usePersistedApolloClient',
    importNames: ['usePersistedApolloClient'],
    message:
      "This hook should only be used once at the top level where the React app is initialized. Use `import { useApolloClient } from '@apollo/client'` to get the default apollo client elsewhere.",
  },
  {
    name: 'expo-localization',
    message:
      'Avoid using due to issue with unsupported locales. Use utilities/src/device/locales.ts getDeviceLocales instead',
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
    name: 'uniswap/src/features/dataApi/balances/balances',
    importNames: ['usePortfolioValueModifiers'],
    message: 'Use the wrapper hooks `usePortfolioTotalValue`, `useAccountListData` or `usePortfolioBalances` instead.',
  },
  {
    name: '@gorhom/bottom-sheet',
    importNames: ['BottomSheetTextInput'],
    message: 'Use our internal BottomSheetTextInput wrapper from /uniswap/src/components/modals/Modal.',
  },
  {
    name: 'expo-haptics',
    message:
      'Use our internal HapticFeedback wrapper instead: import { HapticFeedback } from packages/uniswap/src/features/settings/useHapticFeedback/types',
  },
  {
    name: '@uniswap/analytics',
    importNames: ['sendAnalyticsEvent'],
    message: "Please use the typed `sendAnalyticsEvent` in 'uniswap/src/features/telemetry/send'",
  },
  {
    name: '@tamagui/core',
    message: "Please import from 'tamagui' directly to prevent mismatches.",
  },
  {
    name: 'i18next',
    importNames: ['t'],
    message: 'Use `useTranslation()` hook or `i18n.t` instead of importing `t` directly from i18next.',
  },
  { name: 'lodash', message: 'Use specific imports like `lodash/map` for tree-shaking.' },
  {
    name: 'statsig-react',
    message: 'Use the internal gating module instead of importing from statsig-react directly.',
  },
  {
    name: 'uniswap/src',
    message: 'Avoid importing directly from the uniswap/src barrel which causes circular imports.',
  },
  {
    name: 'wallet/src',
    message: 'Avoid importing directly from the wallet/src barrel which causes circular imports.',
  },
  {
    name: '@uniswap/sdk-core',
    importNames: ['ChainId'],
    message: "Don't use ChainId from @uniswap/sdk-core. Use the UniverseChainId from universe/uniswap.",
  },
  {
    name: 'uniswap/src/features/chains/hooks/useOrderedChainIds',
    importNames: ['useOrderedChainIds'],
    message: 'Use `useEnabledChains` instead, which returns the ordered chains that are currently enabled.',
  },
  {
    name: 'uniswap/src/features/settings/selectors',
    importNames: ['selectIsTestnetModeEnabled'],
    message: 'Use `useEnabledChains` instead.',
  },
  {
    name: 'uniswap/src/features/chains/chainInfo',
    importNames: ['UNIVERSE_CHAIN_INFO'],
    message: 'Use useChainInfo or helpers in packages/uniswap/src/features/chains/utils.ts when possible!',
  },
  {
    name: 'uniswap/src/features/dataApi/balances/balancesRest',
    importNames: ['useRESTPortfolioTotalValue'],
    message: 'Use the wrapper hooks `usePortfolioTotalValue`, `useAccountListData` or `usePortfolioBalances` instead.',
  },
  {
    name: 'wallet/src/components/ErrorBoundary/restart',
    message: 'Use `wallet/src/components/ErrorBoundary/restartApp` instead.',
  },
] as const

/** Pattern that blocks deep imports into @universe/* packages. */
export const crossPackageDeepImportPattern = {
  group: ['@universe/*/src', '@universe/*/src/*'],
  message: 'Deep imports from @universe/* packages are forbidden. Import from the package root instead.',
} as const

export const sharedRestrictedImportPatterns = [
  {
    group: ['ui/src/assets/icons/*.svg'],
    message:
      'Please do not import SVG files directly from `ui/src/assets/icons/*.svg`. Use generated icon components instead.',
  },
  crossPackageDeepImportPattern,
] as const

/**
 * Returns restricted import patterns for @universe/* packages that exclude
 * the package's own deep imports (which are legitimate internal references).
 */
export function restrictedImportPatternsForUniversePackage(packageName: string) {
  return [
    ...sharedRestrictedImportPatterns.filter((p) => p !== crossPackageDeepImportPattern),
    {
      group: ['@universe/*/src', '@universe/*/src/*', `!${packageName}/src`, `!${packageName}/src/*`],
      message: 'Deep imports from @universe/* packages are forbidden. Import from the package root instead.',
    },
  ]
}

// ── Shared no-restricted-syntax selectors ─────────────────────────────
// Used in per-project overrides that customize no-restricted-syntax.
// When a project override redefines no-restricted-syntax, oxlint replaces the
// root definition entirely — so the override must spread these selectors.
// sharedRestrictedSyntaxSelectors applies everywhere the rule is enabled.
export const sharedRestrictedSyntaxSelectors = [
  {
    selector: "CallExpression[callee.object.name='z'][callee.property.name='any']",
    message: 'Avoid using z.any() in favor of more precise custom types.',
  },
] as const

// Kept separate so apps that legitimately read `process.env` (e.g. mission-control,
// dev-portal) can opt out of just this selector while keeping the rest of the
// shared selectors enabled.
export const processEnvRestrictedSyntaxSelector = {
  selector: "MemberExpression[object.name='process'][property.name='env']",
  message: 'Do not read `process.env` directly. Use getConfig() instead.',
} as const

// Shared across every apps/web/src override that redefines no-restricted-syntax
// (e.g. the Portfolio override) — must be spread in, since rule options are not merged.
const webRestrictedSyntaxSelectors = [
  {
    selector: ':matches(ExportAllDeclaration)',
    message: 'Barrel exports bloat the bundle size by preventing tree-shaking.',
  },
  {
    selector: ":matches(Literal[value='NATIVE'])",
    message: "Don't use the string 'NATIVE' directly. Use the NATIVE_CHAIN_ID variable from constants/tokens instead.",
  },
  {
    selector:
      "ImportDeclaration[source.value='src/nft/components/icons'], ImportDeclaration[source.value='nft/components/icons']",
    message: 'Please import icons from nft/components/iconExports instead of directly from icons.tsx',
  },
  {
    selector:
      "VariableDeclarator[id.type='ObjectPattern'][init.callee.name='useWeb3React'] > ObjectPattern > Property[key.name='account']",
    message: "Do not use account directly from useWeb3React. Use the useAccount hook from 'hooks/useAccount' instead.",
  },
  {
    selector:
      "VariableDeclarator[id.type='ObjectPattern'][init.callee.name='useWeb3React'] > ObjectPattern > Property[key.name='chainId']",
    message: 'Do not use chainId directly from useWeb3React. Use the useAccount hook instead.',
  },
  {
    selector:
      "VariableDeclarator[id.type='ObjectPattern'][init.callee.name='useAccount'] > ObjectPattern > Property[key.name='address']",
    message: 'Do not use address directly from useAccount. Access account.address instead.',
  },
  {
    selector:
      "TSTypeAssertion[typeAnnotation.typeName.name='Address'], TSAsExpression[typeAnnotation.typeName.name='Address']",
    message: 'Do not use type assertions with Address. Use assumeOxAddress or isAddress/getAddress from viem.',
  },
] as const

// ── Shared override fragments ────────────────────────────────────────

const jsxPropOrderConfig = [
  'error',
  {
    groups: ['reserved', 'shorthand-prop', 'unknown', 'callback'],
    reservedPattern: '^(key|ref)$',
    callbackPattern: '^on[A-Z].+',
  },
] as const

export default defineConfig({
  plugins: ['react', 'typescript', 'import', 'jest', 'vitest', 'unicorn'],
  jsPlugins: isFastLint
    ? []
    : [
        `${rootDir}config/oxlint-plugins/universe-custom.js`,
        '@jambit/eslint-plugin-typed-redux-saga',
        'eslint-plugin-security',
        'eslint-plugin-no-unsanitized',
        // TODO: Remove oxlint-plugin-eslint after oxlint ships native object-shorthand
        // (https://github.com/oxc-project/oxc/pull/17688)
        'oxlint-plugin-eslint',
      ],
  options: isFastLint
    ? {}
    : {
        typeAware: true,
        reportUnusedDisableDirectives: 'error',
      },
  env: {
    browser: true,
    es2024: true,
    node: true,
  },
  ignorePatterns: rootIgnorePatterns,
  rules: {
    // ── complexity ──────────────────────────────────────────────────────
    complexity: ['error', { max: 30 }],
    'no-regex-spaces': 'warn',
    'prefer-rest-params': 'error',
    'typescript/no-restricted-types': 'error',
    'max-depth': ['error', 4],
    'max-nested-callbacks': ['error', 3],
    'no-sequences': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-useless-catch': 'error',
    'no-useless-escape': 'warn',
    'no-lone-blocks': 'warn',
    'typescript/no-unnecessary-type-constraint': 'error',
    'no-void': 'warn',

    // ── correctness ────────────────────────────────────────────────────
    'react/no-children-prop': 'error',
    'no-empty-character-class': 'warn',
    'no-empty-pattern': 'error',
    'no-nonoctal-decimal-escape': 'error',
    'no-loss-of-precision': 'error',
    'react/forbid-elements': [
      'error',
      {
        forbid: [
          {
            element: 'div',
            message: 'Please avoid using div when possible, even in web code! Use `Flex` or Fragments (`<>`)',
          },
        ],
      },
    ],
    'no-self-assign': 'error',
    'no-case-declarations': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        fix: {
          imports: 'safe-fix',
        },
      },
    ],
    'no-unused-labels': 'error',
    'react/exhaustive-deps': ['error', { additionalHooks: '(useAnimatedStyle|useDerivedValue|useAnimatedProps)' }],
    'react/rules-of-hooks': 'error',
    'use-isnan': 'warn',
    'react/jsx-key': 'error',
    'for-direction': 'error',
    'valid-typeof': 'warn',
    'require-yield': 'error',
    'typescript/explicit-function-return-type': ['error', { allowExpressions: true }],
    'jest/no-disabled-tests': 'error',
    'jest/expect-expect': 'error',
    'jest/no-conditional-expect': 'off',
    'vitest/require-mock-type-parameters': 'off',

    // ── security ───────────────────────────────────────────────────────
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    'no-eval': 'error',
    'unicorn/no-new-buffer': 'error',
    'unicorn/no-new-array': 'off',

    // ── style ──────────────────────────────────────────────────────────
    'jest/no-export': 'error',
    'jest/require-to-throw-message': 'off',
    'jest/no-done-callback': 'error',
    'jest/valid-title': ['error', { ignoreTypeOfDescribeName: true }],
    'typescript/no-namespace': 'error',
    'typescript/no-non-null-assertion': 'error',
    'no-restricted-imports': [
      'error',
      { paths: sharedRestrictedImportPaths, patterns: sharedRestrictedImportPatterns },
    ],
    'no-restricted-globals': [
      'error',
      { name: 'defaultStatus', message: 'Use of this global variable is restricted.' },
      { name: 'status', message: 'Use of this global variable is restricted.' },
      { name: 'scroll', message: 'Use of this global variable is restricted.' },
      { name: 'outerHeight', message: 'Use of this global variable is restricted.' },
      { name: 'screenX', message: 'Use of this global variable is restricted.' },
      { name: 'opener', message: 'Use of this global variable is restricted.' },
      { name: 'onfocus', message: 'Use of this global variable is restricted.' },
      { name: 'pageYOffset', message: 'Use of this global variable is restricted.' },
      { name: 'addEventListener', message: 'Use of this global variable is restricted.' },
      { name: 'defaultstatus', message: 'Use of this global variable is restricted.' },
      { name: 'history', message: 'Use of this global variable is restricted.' },
      { name: 'frames', message: 'Use of this global variable is restricted.' },
      { name: 'screenY', message: 'Use of this global variable is restricted.' },
      { name: 'focus', message: 'Use of this global variable is restricted.' },
      { name: 'outerWidth', message: 'Use of this global variable is restricted.' },
      { name: 'opera', message: 'Use of this global variable is restricted.' },
      { name: 'external', message: 'Use of this global variable is restricted.' },
      { name: 'innerHeight', message: 'Use of this global variable is restricted.' },
      { name: 'closed', message: 'Use of this global variable is restricted.' },
      { name: 'frameElement', message: 'Use of this global variable is restricted.' },
      { name: 'scrollY', message: 'Use of this global variable is restricted.' },
      { name: 'self', message: 'Use of this global variable is restricted.' },
      {
        name: 'chrome',
        message: 'Direct `chrome` access is restricted. Use `getChrome()` or `getChromeWithThrow()` instead.',
      },
      { name: 'onblur', message: 'Use of this global variable is restricted.' },
      { name: 'find', message: 'Use of this global variable is restricted.' },
      { name: 'parent', message: 'Use of this global variable is restricted.' },
      { name: 'top', message: 'Use of this global variable is restricted.' },
      { name: 'moveBy', message: 'Use of this global variable is restricted.' },
      { name: 'menubar', message: 'Use of this global variable is restricted.' },
      { name: 'length', message: 'Use of this global variable is restricted.' },
      { name: 'onerror', message: 'Use of this global variable is restricted.' },
      { name: 'onresize', message: 'Use of this global variable is restricted.' },
      { name: 'removeEventListener', message: 'Use of this global variable is restricted.' },
      { name: 'onload', message: 'Use of this global variable is restricted.' },
      { name: 'scrollTo', message: 'Use of this global variable is restricted.' },
      { name: 'moveTo', message: 'Use of this global variable is restricted.' },
      { name: 'scrollX', message: 'Use of this global variable is restricted.' },
      { name: 'name', message: 'Use of this global variable is restricted.' },
      { name: 'toolbar', message: 'Use of this global variable is restricted.' },
      { name: 'innerWidth', message: 'Use of this global variable is restricted.' },
      { name: 'location', message: 'Use of this global variable is restricted.' },
      { name: 'locationbar', message: 'Use of this global variable is restricted.' },
      { name: 'scrollBy', message: 'Use of this global variable is restricted.' },
      { name: 'resizeTo', message: 'Use of this global variable is restricted.' },
      { name: 'stop', message: 'Use of this global variable is restricted.' },
      { name: 'scrollbars', message: 'Use of this global variable is restricted.' },
      { name: 'blur', message: 'Use of this global variable is restricted.' },
      { name: 'screenTop', message: 'Use of this global variable is restricted.' },
      { name: 'confirm', message: 'Use of this global variable is restricted.' },
      { name: 'screen', message: 'Use of this global variable is restricted.' },
      { name: 'screenLeft', message: 'Use of this global variable is restricted.' },
      { name: 'event', message: 'Use of this global variable is restricted.' },
      { name: 'onunload', message: 'Use of this global variable is restricted.' },
      { name: 'pageXOffset', message: 'Use of this global variable is restricted.' },
      { name: 'resizeBy', message: 'Use of this global variable is restricted.' },
      { name: 'statusbar', message: 'Use of this global variable is restricted.' },
      { name: 'close', message: 'Use of this global variable is restricted.' },
      { name: 'open', message: 'Use of this global variable is restricted.' },
      { name: 'print', message: 'Use of this global variable is restricted.' },
    ],
    yoda: 'warn',
    'no-array-constructor': 'error',
    'typescript/prefer-as-const': 'error',
    curly: 'warn',
    'prefer-const': 'error',
    'typescript/prefer-enum-initializers': 'error',

    // ── additional rules ───────────────────────────────────────────────
    'guard-for-in': 'error',
    'max-lines': ['error', 500],
    'max-params': ['error', { max: 2 }],
    'react/display-name': 'error',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/no-unsafe': 'error',
    'react/self-closing-comp': 'error',
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    'typescript/consistent-return': 'error',
    'typescript/no-floating-promises': 'error',
    'typescript/no-unsafe-return': 'error',
    'typescript/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
    'typescript/no-redundant-type-constituents': 'off',
    'typescript/unbound-method': ['error', { ignoreStatic: true }],
    'typescript/restrict-template-expressions': 'off',
    'typescript/no-base-to-string': 'off',

    // ── suspicious ─────────────────────────────────────────────────────
    'no-alert': 'warn',
    'no-async-promise-executor': 'error',
    'no-bitwise': 'warn',
    'no-ex-assign': 'warn',
    'no-class-assign': 'error',
    'react/jsx-no-comment-textnodes': 'error',
    'no-compare-neg-zero': 'error',
    'no-console': 'error',
    'no-control-regex': 'warn',
    'no-debugger': 'warn',
    'no-new': 'error',
    'no-script-url': 'error',
    eqeqeq: ['warn', 'smart'],
    'no-duplicate-case': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'typescript/no-empty-interface': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-extra-non-null-assertion': 'error',
    'typescript/no-var-requires': 'error',
    'no-fallthrough': 'warn',
    'no-global-assign': 'error',
    'no-irregular-whitespace': 'error',
    'no-label-var': 'warn',
    'no-misleading-character-class': 'error',
    'typescript/no-misused-new': 'error',
    'no-prototype-builtins': 'error',
    'no-self-compare': 'warn',
    'no-shadow': 'error',
    'no-shadow-restricted-names': 'warn',
    'no-sparse-arrays': 'warn',
    'typescript/no-unsafe-declaration-merging': 'error',
    'typescript/triple-slash-reference': 'error',
    'no-useless-backreference': 'error',
    'no-var': 'error',
    'no-with': 'warn',

    // TODO(apps-infra): The following rules were used in eslint or biome but are not currently
    // supported by oxlint or require tweaking with a custom plugin. Re-enable when possible.
    // 'import/no-unused-modules': 'error', // On the roadmap: https://github.com/oxc-project/oxc/issues/1117
    // 'react-native/no-unused-styles': 'error', // Requires @react-native/eslint-plugin
    // 'react-native/sort-styles': 'error', // Requires @react-native/eslint-plugin
    // 'storybook/recommended': 'error', // Requires @storybook/eslint-plugin v0.8.0 or a storybook upgrade

    // ── jsPlugin rules (excluded when ENABLE_FAST_LINT=true) ──────────
    ...(!isFastLint && {
      // correctness
      'import/no-cycle': ['error', { ignoreExternal: true }],
      // security
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      // TODO: Replace with native object-shorthand after next oxlint update
      // (https://github.com/oxc-project/oxc/pull/17688)
      'eslint-js/object-shorthand': ['error', 'always'],
      // Not implemented natively by oxlint; provided via oxlint-plugin-eslint.
      'eslint-js/no-octal-escape': 'warn',
      'eslint-js/no-undef-init': 'warn',
      'eslint-js/no-restricted-syntax': [
        'error',
        ...sharedRestrictedSyntaxSelectors,
        processEnvRestrictedSyntaxSelector,
      ],
      // custom rules (from universe-custom plugin)
      'universe-custom/no-unwrapped-t': [
        'error',
        { blockedElements: ['Flex', 'AnimatedFlex', 'TouchableArea', 'Trace'] },
      ],
      'universe-custom/custom-map-sort': 'error',
      'universe-custom/no-hex-string-casting': 'error',
      'universe-custom/no-transform-percentage-strings': 'error',
      'universe-custom/enforce-query-options-result': [
        'error',
        { importPath: 'utilities/src/reactQuery/queryOptions' },
      ],
      'universe-custom/no-redux-modals': 'error',
      'universe-custom/no-tolowercase-address-currencyid': 'warn',
      'universe-custom/no-platform-gate-in-chain-flags': 'error',
      // typed-redux-saga
      '@jambit/typed-redux-saga/use-typed-effects': 'error',
      '@jambit/typed-redux-saga/delegate-effects': 'error',
    }),
  },
  overrides: [
    // ═══════════════════════════════════════════════════════════════════
    // SHARED OVERRIDES (apply across all projects)
    // ═══════════════════════════════════════════════════════════════════

    // ── Migration files: relax type rules ─────────────────────────────
    {
      files: ['**/*migration*', '**/*Migration*', '**/migrations/**/*.ts'],
      rules: {
        'typescript/explicit-function-return-type': 'off',
        'typescript/no-explicit-any': 'off',
        'typescript/no-non-null-assertion': 'off',
        'typescript/no-unsafe-return': 'off',
      },
    },

    // ── Saga files ──────────────────────
    {
      files: ['**/*saga.ts', '**/*saga.tsx', '**/*Saga.ts', '**/*Saga.tsx'],
      rules: {
        // redux-saga's call/fork/etc. bind the receiver via the
        // [obj, method] array form, an idiom unbound-method can't model, so it
        // false-positives on the bound method reference. Disable it for sagas.
        'typescript/unbound-method': 'off',
      },
    },

    // ── Logger, scripts, devtools: allow console ──────────────────────
    {
      files: [
        '**/logger/**',
        '**/scripts/**',
        '**/setupTests.*',
        '**/sideEffects.*',
        '**/devtools.*',
        '**/wxt.config.*',
        '**/e2e/fixtures/**',
        'tools/**',
      ],
      rules: {
        'no-console': 'off',
      },
    },
    // ── Storybook: allow alerts ───────────────────────────────────────
    {
      files: ['**/*.stories.*', '**/.storybook/**'],
      rules: {
        'no-alert': 'off',
      },
    },
    // ── JavaScript files: allow console ───────────────────────────────
    {
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        'no-console': 'off',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // PER-PROJECT OVERRIDES
    // ═══════════════════════════════════════════════════════════════════

    // ── apps/cli, config-cli ──────────────────────────────────────────────────────
    {
      files: ['apps/cli/**', 'packages/config-cli/**'],
      rules: {
        'no-console': 'off',
        'typescript/explicit-function-return-type': 'off',
        // cli legitimately reads process.env directly; redefine the rule
        // without processEnvRestrictedSyntaxSelector.
        ...(!isFastLint && {
          'eslint-js/no-restricted-syntax': ['error', ...sharedRestrictedSyntaxSelectors],
        }),
      },
    },
    ...(!isFastLint
      ? [
          {
            files: ['apps/cli/**/*.ts', 'apps/cli/**/*.tsx'],
            rules: {
              'universe-custom/no-relative-import-paths': [
                'error' as const,
                { allowSameFolder: false, prefix: '@universe/cli' },
              ],
            },
          },
        ]
      : []),

    // ── apps/dev-portal ───────────────────────────────────────────────
    {
      files: ['apps/dev-portal/**'],
      rules: {
        'typescript/explicit-function-return-type': 'off',
        'react/forbid-elements': 'off',
        'max-params': 'off',
        'max-lines': 'off',
        'typescript/consistent-return': 'off',
        'typescript/no-floating-promises': 'off',
        'typescript/no-unnecessary-condition': 'off',
        // dev-portal legitimately reads process.env at the SSR boundary; redefine
        // the rule without processEnvRestrictedSyntaxSelector.
        ...(!isFastLint && {
          'eslint-js/no-restricted-syntax': ['error', ...sharedRestrictedSyntaxSelectors],
        }),
      },
    },
    ...(!isFastLint
      ? [
          {
            files: ['apps/dev-portal/**/*.ts', 'apps/dev-portal/**/*.tsx'],
            rules: {
              'universe-custom/no-relative-import-paths': ['error' as const, { allowSameFolder: false }],
            },
          },
        ]
      : []),

    // ── apps/extension ────────────────────────────────────────────────
    {
      files: ['apps/extension/**'],
      rules: {
        'typescript/explicit-function-return-type': 'off',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              ...sharedRestrictedImportPaths,
              {
                name: 'ethers',
                message: "Please import from '@ethersproject/module' directly to support tree-shaking.",
              },
            ],
            patterns: [...sharedRestrictedImportPatterns],
          },
        ],
        'no-restricted-globals': 'off',
        ...(!isFastLint && {
          'eslint-js/no-restricted-syntax': [
            'error',
            ...sharedRestrictedSyntaxSelectors,
            processEnvRestrictedSyntaxSelector,
            {
              selector:
                "CallExpression[callee.property.name='sendMessage'][callee.object.property.name='tabs'][callee.object.object.name='chrome']",
              message:
                'Use a message channel from apps/extension/src/background/messagePassing/messageChannels.ts instead of chrome.tabs.sendMessage.',
            },
            {
              selector:
                "CallExpression[callee.property.name='sendMessage'][callee.object.property.name='runtime'][callee.object.object.name='chrome']",
              message:
                'Use a message channel from apps/extension/src/background/messagePassing/messageChannels.ts instead of chrome.runtime.sendMessage.',
            },
            {
              selector:
                "CallExpression[callee.property.name='addListener'][callee.object.property.name='onMessage'][callee.object.object.property.name='runtime'][callee.object.object.object.name='chrome']",
              message: 'Use a message channel instead of chrome.runtime.onMessage.addListener.',
            },
            {
              selector:
                "CallExpression[callee.property.name='removeListener'][callee.object.property.name='onMessage'][callee.object.object.property.name='runtime'][callee.object.object.object.name='chrome']",
              message: 'Use a message channel instead of chrome.runtime.onMessage.removeListener.',
            },
          ],
        }),
      },
    },
    ...(!isFastLint
      ? [
          {
            files: ['apps/extension/**/*.ts', 'apps/extension/**/*.tsx'],
            rules: {
              'universe-custom/no-relative-import-paths': ['error' as const, { allowSameFolder: false }],
            },
          },
        ]
      : []),
    {
      files: ['apps/extension/**/contentScript/**'],
      rules: {
        'no-restricted-globals': [
          'error',
          {
            name: 'chrome',
            message: 'Direct `chrome` access is restricted. Use `getChrome()` or `getChromeWithThrow()` instead.',
          },
        ],
      },
    },
    ...(!isFastLint
      ? [
          {
            files: ['apps/extension/webpack*.js', 'apps/extension/webpack-plugins/**'],
            rules: {
              'security/detect-non-literal-regexp': 'off' as const,
              'no-console': 'off' as const,
            },
          },
        ]
      : [
          {
            files: ['apps/extension/webpack*.js', 'apps/extension/webpack-plugins/**'],
            rules: {
              'no-console': 'off' as const,
            },
          },
        ]),
    {
      files: ['apps/extension/**/extensionMigrations.ts', 'apps/extension/**/extensionMigrationsTests.ts'],
      rules: {
        'typescript/prefer-enum-initializers': 'off',
        'typescript/no-non-null-assertion': 'off',
        'typescript/no-empty-interface': 'off',
        'typescript/no-explicit-any': 'off',
      },
    },

    // ── apps/mission-control ──────────────────────────────────────────
    {
      files: ['apps/mission-control/**'],
      rules: {
        'typescript/explicit-function-return-type': 'off',
        'react/forbid-elements': 'off',
        'max-params': 'off',
        'max-lines': 'off',
        'jest/no-disabled-tests': 'off',
        // mission-control legitimately reads process.env at the SSR boundary;
        // redefine the rule without processEnvRestrictedSyntaxSelector.
        ...(!isFastLint && {
          'eslint-js/no-restricted-syntax': ['error', ...sharedRestrictedSyntaxSelectors],
        }),
      },
    },
    {
      files: ['apps/mission-control/**/*.ts', 'apps/mission-control/**/*.tsx'],
      rules: {
        'typescript/no-floating-promises': 'off',
        'typescript/no-unnecessary-condition': 'off',
        ...(!isFastLint && {
          'universe-custom/no-relative-import-paths': ['error', { allowSameFolder: false }],
        }),
      },
    },
    ...(!isFastLint
      ? [
          {
            files: ['apps/mission-control/api/**/*.ts'],
            rules: {
              'universe-custom/no-relative-import-paths': 'off' as const,
            },
          },
        ]
      : []),
    {
      files: [
        'apps/mission-control/**/__tests__/**/*.ts',
        'apps/mission-control/**/__tests__/**/*.tsx',
        'apps/mission-control/**/*.test.ts',
        'apps/mission-control/**/*.test.tsx',
      ],
      rules: { 'react/no-children-prop': 'off' },
    },

    // ── apps/mobile ───────────────────────────────────────────────────
    {
      files: ['apps/mobile/**'],
      rules: {
        'typescript/explicit-function-return-type': 'off',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              ...sharedRestrictedImportPaths,
              {
                name: 'react-router',
                message: 'Do not import react-router in native code. Use react-navigation instead.',
              },
              {
                name: 'statsig-react-native',
                message: 'Use the internal gating module instead of importing from statsig-react-native directly.',
              },
            ],
            patterns: [
              ...sharedRestrictedImportPatterns,
              {
                group: ['@ethersproject/*', '!@ethersproject/bignumber'],
                message: "Import from 'ethers' directly instead of '@ethersproject/*' sub-packages.",
              },
            ],
          },
        ],
        ...(!isFastLint && {
          'universe-custom/enum-member-naming': 'error',
          'universe-custom/no-transform-percentage-strings': 'error',
        }),
      },
    },
    ...(!isFastLint
      ? [
          {
            files: ['apps/mobile/**/*.ts', 'apps/mobile/**/*.tsx'],
            rules: {
              'universe-custom/no-relative-import-paths': ['error' as const, { allowSameFolder: false, prefix: 'src' }],
              'universe-custom/no-nested-component-definitions': 'error' as const,
              'universe-custom/jsx-prop-order': jsxPropOrderConfig,
            },
          },
        ]
      : []),
    {
      files: ['apps/mobile/**/*saga*.ts', 'apps/mobile/**/*Saga.ts', 'apps/mobile/**/handleDeepLink.ts'],
      rules: { 'typescript/prefer-enum-initializers': 'off' },
    },
    {
      files: ['apps/mobile/migrations.ts'],
      rules: {
        'typescript/prefer-enum-initializers': 'off',
        'typescript/no-non-null-assertion': 'off',
        'typescript/no-empty-interface': 'off',
        'typescript/no-explicit-any': 'off',
      },
    },
    {
      files: ['apps/mobile/.maestro/scripts/**'],
      rules: {
        'no-restricted-imports': 'off',
        curly: 'off',
        'no-console': 'off',
        'no-lone-blocks': 'off',
        'no-case-declarations': 'off',
        'no-unused-vars': 'off',
      },
    },

    // ── apps/web ──────────────────────────────────────────────────────
    {
      files: ['apps/web/**'],
      rules: {
        'typescript/explicit-function-return-type': 'off',
        'typescript/no-floating-promises': 'off',
      },
    },
    ...(!isFastLint
      ? [
          {
            files: ['apps/web/src/**/*.ts', 'apps/web/src/**/*.tsx'],
            rules: {
              'universe-custom/no-relative-import-paths': [
                'error' as const,
                { allowSameFolder: false, rootDir: 'src' },
              ],
              'universe-custom/import-boundary': 'error' as const,
              'universe-custom/no-direct-viem-ethers-import': 'error' as const,
            },
          },
        ]
      : []),
    ...(!isFastLint
      ? [
          {
            files: ['apps/web/src/**/*.ts', 'apps/web/src/**/*.tsx'],
            rules: {
              'eslint-js/no-restricted-syntax': [
                'error' as const,
                ...sharedRestrictedSyntaxSelectors,
                processEnvRestrictedSyntaxSelector,
                ...webRestrictedSyntaxSelectors,
              ],
            },
          },
          {
            files: ['apps/web/src/pages/Portfolio/**'],
            rules: {
              'eslint-js/no-restricted-syntax': [
                'error' as const,
                ...sharedRestrictedSyntaxSelectors,
                processEnvRestrictedSyntaxSelector,
                ...webRestrictedSyntaxSelectors,
                {
                  selector: "CallExpression[callee.name='useAccount']",
                  message:
                    "Do not call 'useAccount' in portfolio pages. Use 'pages/Portfolio/hooks/usePortfolioAddress' instead.",
                },
              ],
            },
          },
        ]
      : []),
    // Disable the no-cycles lint rule for web/state/sagas
    // The sagas and redux store have many cycles, deep refactoring is needed
    {
      files: ['apps/web/src/state/sagas/**/*.ts'],
      rules: {
        'import/no-cycle': 'off',
      },
    },
    {
      files: [
        'apps/web/vite.config.*',
        'apps/web/vite/**',
        'apps/web/functions/**',
        'apps/web/.storybook/**',
        'apps/web/playwright.config.ts',
        'apps/web/public/**',
      ],
      rules: {
        'no-console': 'off',
        'typescript/no-explicit-any': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['apps/web/src/**'],
      rules: {
        'typescript/no-explicit-any': 'off',
        'no-bitwise': 'off',
        'typescript/no-non-null-assertion': 'off',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              ...sharedRestrictedImportPaths,
              {
                name: 'src/nft/components/icons',
                message: 'Please import icons from nft/components/iconExports instead of directly from icons.tsx',
              },
              {
                name: 'nft/components/icons',
                message: 'Please import icons from nft/components/iconExports instead of directly from icons.tsx',
              },
              {
                name: '@playwright/test',
                message: 'Import test and expect from playwright/fixtures instead.',
              },
              {
                name: 'styled-components',
                message: 'Styled components is deprecated, please use Flex or styled from "ui/src" instead.',
              },
              {
                name: 'ui/src/components/icons',
                message:
                  'Please import icons directly from their respective files to avoid importing the entire icons folder.',
              },
              {
                name: '@universe/environment',
                importNames: ['isIOS', 'isAndroid'],
                message: 'Use isWebIOS and isWebAndroid instead.',
              },
              {
                name: 'src/test-utils',
                message: 'test-utils should not be imported in non-test files',
              },
              {
                name: 'wagmi',
                importNames: [
                  'useChainId',
                  'useAccount',
                  'useConnect',
                  'useDisconnect',
                  'useBlockNumber',
                  'useWatchBlockNumber',
                ],
                message: 'Import wrapped utilities from internal hooks instead.',
              },
              {
                name: '@privy-io/react-auth',
                importNames: ['usePrivy', 'useLoginWithOAuth', 'useLoginWithEmail', 'useAuthorizationSignature'],
                message:
                  'Use the gated `useMaybe*` hooks from `~/hooks/useMaybePrivy` instead. `MaybePrivyProvider` only mounts <PrivyProvider> when Privy is configured (PRIVY_APP_ID / PRIVY_CLIENT_ID); Privy hooks read provider-backed contexts at render and crash the page when it is not.',
              },
              {
                name: 'i18next',
                importNames: ['i18n'],
                message: 'Use `uniswap/src/i18n` instead of importing i18n from i18next directly.',
              },
              {
                name: 'moment',
                message: 'moment is not configured for tree-shaking. Use a lighter alternative.',
              },
              {
                name: 'react-helmet-async',
                message: "Import from 'react-helmet-async/lib/index' instead.",
              },
              {
                name: 'zustand',
                importNames: ['default'],
                message: 'Use named import `{ create }` from zustand instead of the default import.',
              },
            ],
            patterns: [
              ...sharedRestrictedImportPatterns,
              {
                group: [
                  'react-native',
                  'react-native-*',
                  '!react-native-reanimated',
                  '!react-native-image-colors',
                  '!react-native-localize',
                  '@react-native/*',
                  '@react-native-community/*',
                  '!@react-native-community/netinfo',
                  '@testing-library/react-native',
                ],
                message: 'react-native modules should not be imported in web code. Use web-compatible alternatives.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['apps/web/src/playwright/**'],
      rules: { 'no-console': 'off' },
    },
    {
      files: ['apps/web/**/*.e2e.test.ts', 'apps/web/**/*.anvil.e2e.test.ts'],
      rules: { 'no-restricted-imports': 'off' },
    },

    // ── packages/uniswap ──────────────────────────────────────────────
    ...(!isFastLint
      ? [
          {
            files: ['packages/uniswap/**'],
            rules: {
              'universe-custom/enum-member-naming': 'error' as const,
              'universe-custom/no-relative-import-paths': [
                'error' as const,
                { allowSameFolder: false, prefix: 'uniswap' },
              ],
            },
          },
          {
            files: ['packages/uniswap/**/*.ts', 'packages/uniswap/**/*.tsx'],
            rules: {
              'universe-custom/no-nested-component-definitions': 'error' as const,
              'universe-custom/jsx-prop-order': jsxPropOrderConfig,
            },
          },
        ]
      : []),

    // ── packages/wallet ───────────────────────────────────────────────
    ...(!isFastLint
      ? [
          {
            files: ['packages/wallet/**'],
            rules: {
              'universe-custom/enum-member-naming': 'error' as const,
              'universe-custom/no-relative-import-paths': [
                'error' as const,
                { allowSameFolder: false, prefix: 'wallet' },
              ],
            },
          },
          {
            files: ['packages/wallet/**/*.ts', 'packages/wallet/**/*.tsx'],
            rules: {
              'universe-custom/no-nested-component-definitions': 'error' as const,
              'universe-custom/jsx-prop-order': jsxPropOrderConfig,
            },
          },
        ]
      : []),

    // ── packages/ui ───────────────────────────────────────────────────
    {
      files: ['packages/ui/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              ...sharedRestrictedImportPaths,
              {
                name: 'ui/src',
                message:
                  'Avoid importing directly from ui/src from within the ui package which causes circular imports.',
              },
            ],
            patterns: [...sharedRestrictedImportPatterns],
          },
        ],
      },
    },
    ...(!isFastLint
      ? [
          {
            files: ['packages/ui/**'],
            rules: {
              'universe-custom/no-relative-import-paths': ['error' as const, { allowSameFolder: false, prefix: 'ui' }],
            },
          },
          {
            files: ['packages/ui/**/*.ts', 'packages/ui/**/*.tsx'],
            rules: {
              'universe-custom/no-nested-component-definitions': 'error' as const,
              'universe-custom/jsx-prop-order': jsxPropOrderConfig,
            },
          },
        ]
      : []),

    // ── packages/utilities ────────────────────────────────────────────
    ...(!isFastLint
      ? [
          {
            files: ['packages/utilities/**'],
            rules: {
              'universe-custom/no-relative-import-paths': [
                'error' as const,
                { allowSameFolder: false, prefix: 'utilities' },
              ],
            },
          },
        ]
      : []),

    // ── packages/datadog-cloud ────────────────────────────────────────
    {
      files: ['packages/datadog-cloud/**'],
      rules: {
        'typescript/no-floating-promises': 'off',
        'typescript/no-unnecessary-condition': 'off',
      },
    },

    // ── packages/prices ───────────────────────────────────────────────
    {
      files: ['packages/prices/**'],
      rules: {
        'max-params': 'off',
        ...(!isFastLint && {
          'universe-custom/no-relative-import-paths': ['error', { allowSameFolder: false, prefix: '@universe/prices' }],
        }),
        'no-restricted-imports': [
          'error',
          {
            paths: [...sharedRestrictedImportPaths],
            patterns: restrictedImportPatternsForUniversePackage('@universe/prices'),
          },
        ],
      },
    },

    // ── @universe/* packages with standard pattern ────────────────────
    // (no-relative-import-paths + restrictedImportPatternsForUniversePackage)
    ...(
      ['api', 'compliance', 'config', 'gating', 'notifications', 'sessions', 'transactional', 'websocket'] as const
    ).map((pkg) => ({
      files: [`packages/${pkg}/**`],
      rules: {
        ...(!isFastLint && {
          'universe-custom/no-relative-import-paths': [
            'error' as const,
            { allowSameFolder: false, prefix: `@universe/${pkg}` },
          ],
        }),
        'no-restricted-imports': [
          'error' as const,
          {
            paths: [...sharedRestrictedImportPaths],
            patterns: restrictedImportPatternsForUniversePackage(`@universe/${pkg}`),
          },
        ],
      },
    })),

    // ═══════════════════════════════════════════════════════════════════
    // TEST FILE OVERRIDE — must come LAST to override per-project rules
    // ═══════════════════════════════════════════════════════════════════
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/test/**', '**/tests/**'],
      rules: {
        'max-nested-callbacks': 'off',
        complexity: 'off',
        'max-depth': 'off',
        'max-lines': 'off',
        'max-params': 'off',
        'typescript/explicit-function-return-type': 'off',
        'react/display-name': 'off',
        'react/forbid-elements': 'off',
        'no-unused-vars': 'off',
        'react/exhaustive-deps': 'off',
        'typescript/prefer-enum-initializers': 'off',
        'typescript/no-non-null-assertion': 'off',
        'no-restricted-imports': 'off',
        'no-restricted-globals': 'off',
        'typescript/no-empty-interface': 'off',
        'typescript/no-explicit-any': 'off',
        'no-shadow': 'off',
        'no-shadow-restricted-names': 'off',
        'no-console': 'off',
        'no-lone-blocks': 'off',
        'no-unsafe-optional-chaining': 'off',
        'import/no-cycle': 'off',
        'typescript/triple-slash-reference': 'off',
        'typescript/await-thenable': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/no-misused-spread': 'off',
        'typescript/no-var-requires': 'off',
        'typescript/unbound-method': 'off',
        'prefer-const': 'off',
        'vitest/hoisted-apis-on-top': 'error',
        ...(!isFastLint && {
          'universe-custom/jsx-prop-order': 'off',
          'universe-custom/no-nested-component-definitions': 'off',
          'universe-custom/no-relative-import-paths': 'off',
          'universe-custom/enforce-query-options-result': 'off',
          'universe-custom/no-unwrapped-t': 'off',
          'universe-custom/custom-map-sort': 'off',
          'universe-custom/no-hex-string-casting': 'off',
          'universe-custom/no-direct-viem-ethers-import': 'off',
          'security/detect-non-literal-regexp': 'off',
          'eslint-js/no-restricted-syntax': 'off',
          '@jambit/typed-redux-saga/use-typed-effects': 'off',
          '@jambit/typed-redux-saga/delegate-effects': 'off',
        }),
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // E2E TEST OVERRIDES — must come AFTER the test override so their
    // no-restricted-syntax selectors aren't wiped out by the test override.
    // ═══════════════════════════════════════════════════════════════════
    ...(!isFastLint
      ? [
          {
            files: ['apps/web/**/*.e2e.test.ts'],
            rules: {
              'eslint-js/no-restricted-syntax': [
                'error' as const,
                {
                  selector: "CallExpression[callee.property.name='getByTestId'] > Literal",
                  message: 'Use TestID enum instead of string literals with getByTestId.',
                },
                {
                  selector:
                    "CallExpression[callee.name='getTest'] > ObjectExpression > Property[key.name='withAnvil'][value.value=true]",
                  message: 'Anvil tests must be in *.anvil.e2e.test.ts files.',
                },
                {
                  selector: "MemberExpression[object.name='anvil']",
                  message: 'Anvil fixture usage must be in *.anvil.e2e.test.ts files.',
                },
              ],
            },
          },
          {
            // Anvil files legitimately use `anvil.*` and `withAnvil: true` — drop those
            // restrictions here. Must come after the broader e2e override above, since
            // later overrides replace earlier rule options for overlapping files.
            files: ['apps/web/**/*.anvil.e2e.test.ts'],
            rules: {
              'eslint-js/no-restricted-syntax': [
                'error' as const,
                {
                  selector: "CallExpression[callee.property.name='getByTestId'] > Literal",
                  message: 'Use TestID enum instead of string literals with getByTestId.',
                },
              ],
            },
          },
        ]
      : []),
  ],
})
