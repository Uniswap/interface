import path from 'path'
import type { Alias } from 'vite'
import { createReactNativeWebAliases } from 'vite-presets/moduleResolutions'

/** `webRoot` is the apps/web directory. */
export function createWebAliases(webRoot: string): Alias[] {
  return [
    // Exact match only: the web app-specific i18n entry doesn't import wallet's i18n-setup
    {
      find: /^uniswap\/src\/i18n$/,
      replacement: path.resolve(webRoot, '../../packages/uniswap/src/i18n/index.web-app.ts'),
    },
    { find: 'expo-blur', replacement: path.resolve(webRoot, 'src/lib/expo-blur.jsx') },
    { find: '@web3-react/core', replacement: path.resolve(webRoot, 'src/connection/web3reactShim.ts') },
    { find: 'expo-clipboard', replacement: path.resolve(webRoot, 'src/lib/expo-clipboard.jsx') },
    ...createReactNativeWebAliases(),
  ]
}
