import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Plugins and aliases mirror packages/ui/vitest.config.ts so the Tamagui→Tailwind
// parity harness (src/parity) can render the real Tamagui `Flex` under jsdom +
// react-native-web. The React plugin is required: pulling the `ui/src` barrel
// drags the packages/ui component tree into the module graph, and those files
// inherit `jsx: "preserve"` from config/tsconfig/ui.json. Without an explicit JSX
// transform, Vite's import-analysis parses their raw JSX as plain JS and fails.
// Plain token tests keep the default `node` environment; the parity test opts
// into jsdom via a `@vitest-environment jsdom` docblock.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    pool: 'forks',
    testTimeout: 30000,
    setupFiles: ['./vitest-setup.ts'],
    env: {
      APP_ID: 'web',
    },
    server: {
      deps: {
        inline: [/ui\/src\/theme/],
        fallbackCJS: true,
      },
    },
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      'ui/src': path.resolve(__dirname, '../ui/src'),
      'utilities/src': path.resolve(__dirname, '../utilities/src'),
      'uniswap/src': path.resolve(__dirname, '../uniswap/src'),
      'react-native': 'react-native-web',
      // Must precede the bare 'tamagui' alias: that alias maps to a file, so its
      // prefix substitution would break the 'tamagui/linear-gradient' subpath
      // import pulled in by the ui/src barrel.
      'tamagui/linear-gradient': path.resolve(__dirname, '../../node_modules/tamagui/dist/cjs/linear-gradient.cjs'),
      '@tamagui/core': path.resolve(__dirname, '../../node_modules/@tamagui/core/dist/cjs/index.cjs'),
      '@tamagui/web': path.resolve(__dirname, '../../node_modules/@tamagui/web/dist/cjs/index.cjs'),
      '@tamagui/use-direction': path.resolve(__dirname, '../../node_modules/@tamagui/use-direction/dist/cjs/index.cjs'),
      '@tamagui/use-callback-ref': path.resolve(
        __dirname,
        '../../node_modules/@tamagui/use-callback-ref/dist/cjs/index.cjs',
      ),
      tamagui: path.resolve(__dirname, '../../node_modules/tamagui/dist/cjs/index.cjs'),
    },
  },
  optimizeDeps: {
    include: ['react-native-web', '@testing-library/react'],
  },
})
