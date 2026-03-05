// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */

const preset = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...preset,
  preset: 'jest-expo',
  displayName: 'Wallet Package',
  testTimeout: 15000,
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.stories.**',
    '!src/abis/**', // auto-generated abis
    '!src/data/__generated__/**', // auto-generated graphql
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 0,
    },
  },
  haste: {
    defaultPlatform: 'ios',
    // avoid native because wallet tests assume no .native.ts
    platforms: ['web', 'ios', 'android'],
  },
  // Override moduleFileExtensions to NOT prioritize .web.ts for native tests
  // This ensures wallet tests use moti animations from index.ts, not CSS from index.web.ts
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  setupFiles: [
    './jest-setup.js',
  ],
  // we map core to tamagui's test bundle, this just makes setup simpler for jest
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '@tamagui/core': '@tamagui/core/native-test',
    '@tamagui/web': '@tamagui/core/native-test',
    // Map theme animations to native version for tests (base index.ts uses CSS animations now)
    'ui/src/theme/animations$': '<rootDir>/../ui/src/theme/animations/index.native.ts',
    // Map platform-specific animation components to native versions for tests
    'ui/src/components/factories/animated$': '<rootDir>/../ui/src/components/factories/animated.native.tsx',
    'ui/src/components/layout/AnimatedFlex$': '<rootDir>/../ui/src/components/layout/AnimatedFlex.native.tsx',
    'ui/src/components/layout/AnimatedScrollView$': '<rootDir>/../ui/src/components/layout/AnimatedScrollView.native.ts',
    'ui/src/components/AnimatedFlashList/AnimatedFlashList$': '<rootDir>/../ui/src/components/AnimatedFlashList/AnimatedFlashList.native.tsx',
  },
}
