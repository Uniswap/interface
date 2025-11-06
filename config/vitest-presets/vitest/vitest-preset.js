// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */
const globals = require('./globals')
const path = require('path')

/** @type import('vitest/config').UserConfig */
module.exports = {
  test: {
    globals: true, // Enable Jest-like global APIs (describe, it, expect, etc.)
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        customExportConditions: ['react-native'],
      },
    },
    moduleNameMapper: {
      '\\.(css|less|sass|scss|png|jpg|jpeg|gif|ttf|woff|woff2|mp4)$': 'identity-obj-proxy',
      '^src/(.*)$': path.resolve(__dirname, './src/$1'),
    },
    moduleDirectories: ['node_modules', 'src'],
    include: ['**/*.(spec|test).[jt]s?(x)'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: [path.resolve(__dirname, './setup.js')],
    coverage: {
      enabled: false, // only collect in CI
      reporter: ['json', 'lcov', 'html'],
      include: ['packages/**/src/**/*.ts'],
    },
    clearMocks: true,
    pool: 'forks',
    testTimeout: 10000,
    env: globals.globals,
  },
  resolve: {
    alias: {
      '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2|mp4)$': 'identity-obj-proxy',
      '^src/(.*)$': path.resolve(__dirname, './src/$1'),
    },
  },
  optimizeDeps: {
    include: [
      'react-native',
      'react-native-web',
      'react-native-modal-selector',
      'react-native-modal-datetime-picker',
      'react-native-keyboard-controller',
      '@react-navigation/**',
      '@storybook/react-native',
      '@react-native-community/datetimepicker',
      'react-native-image-colors',
      'uuid',
      'react-native-reanimated',
      'react-native-safe-area-context',
      'react-native-localize',
      '@react-native-masked-view/**',
      '@statsig-js/js-client',
      '@statsig/react-native-bindings',
      '@statsig/react-bindings',
      '@statsig/js-local-overrides',
      '@react-native/**',
      '@react-native-firebase/**',
      '@uniswap/client-embeddedwallet',
      '@uniswap/client-data-api',
      'react-native-webview',
      '@gorhom/**',
      'expo*',
      'd3-array',
      'd3-color',
      'd3-format',
      'd3-interpolate',
      'd3-path',
      'd3-scale',
      'd3-shape',
      'd3-time-format',
      'd3-time',
      'internmap',
      'react-native-qrcode-svg',
      'react-native-modal',
      'react-native-animatable',
      'react-native-masked-view',
      'redux-persist',
      'react-native-url-polyfill',
      'react-native-context-menu-view',
      'react-native-wagmi-charts',
      'react-native-markdown-display',
      'react-native-redash',
      '@walletconnect/**',
      'moti',
      'react-native-image-picker',
      'wagmi',
      'viem',
      'rn-qr-generator',
      '@solana/**',
      'jayson',
    ],
  },
}
