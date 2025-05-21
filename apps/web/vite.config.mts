import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import { analyzer } from 'vite-bundle-analyzer'
import commonjs from 'vite-plugin-commonjs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get git commit hash
const commitHash = execSync('git rev-parse HEAD').toString().trim()

export default defineConfig(({ mode }) => {
  // Load ALL env variables (including those without VITE_ prefix)
  const env = loadEnv(mode, process.cwd(), '')

  const isProduction = mode === 'production'
  const root = path.resolve(__dirname)

  // External package aliases only
  const overrides = {
    // External package aliases
    'react-native': 'react-native-web',
    crypto: 'expo-crypto',
    'expo-blur': path.resolve(__dirname, './.storybook/__mocks__/expo-blur.jsx'),
    '@web3-react/core': path.resolve(__dirname, 'src/connection/web3reactShim.ts'),
    'uniswap/src': path.resolve(__dirname, '../../packages/uniswap/src'),
    'utilities/src': path.resolve(__dirname, '../../packages/utilities/src'),
    'ui/src': path.resolve(__dirname, '../../packages/ui/src'),
    'expo-clipboard': path.resolve(__dirname, 'src/lib/expo-clipboard.jsx'),
    jsbi: path.resolve(__dirname, '../../node_modules/jsbi/dist/jsbi.mjs'), // force consistent ESM build
  }

  // Create process.env definitions for ALL environment variables
  const envDefines = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
  )

  return {
    root,

    define: {
      __DEV__: !isProduction,
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.EXPO_OS': JSON.stringify('web'),
      'process.env.GIT_COMMIT_HASH': JSON.stringify(commitHash),
      ...envDefines,
    },

    resolve: {
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
      preserveSymlinks: true,
      modules: [path.resolve(root, 'node_modules')],
      dedupe: [
        '@uniswap/sdk-core',
        '@uniswap/v2-sdk',
        '@uniswap/v3-sdk',
        '@uniswap/v4-sdk',
        '@uniswap/router-sdk',
        '@uniswap/universal-router-sdk',
        '@uniswap/uniswapx-sdk',
        '@uniswap/permit2-sdk',
        'jsbi',
        'ethers',
      ],
      alias: {
        ...overrides,
      },
    },

    plugins: [
      react(),
      tsconfigPaths(),
      svgr({
        svgrOptions: {
          icon: false,
          ref: true,
          titleProp: true,
          exportType: 'named',
          svgo: true,
          svgoConfig: {
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: { removeViewBox: false },
                },
              },
              'removeDimensions',
            ],
          },
        },
        include: '**/*.svg',
      }),
      {
        name: 'copy-rive-wasm',
        async buildStart() {
          await import('./scripts/copy-rive-wasm.js')
        },
      },
      {
        name: 'svg-import-fix',
        transform(code: string) {
          const regex = /import\s+([a-zA-Z0-9_$]+)\s+from\s+['"]([^'"]+\.svg)['"]/g

          const transformed = code.replace(regex, (match, varName, path) => {
            // Don't touch named imports like { ReactComponent }
            if (match.includes('{')) return match
            // Skip if it already has a query param
            if (path.includes('?')) return match

            return `import ${varName} from '${path}?url'`
          })

          return transformed === code ? null : transformed
        },
      },
      nodePolyfills({
        globals: {
          process: true,
        },
        include: ['path', 'buffer'],
      }),
      commonjs({
        dynamic: {
          loose: false,
        },
      }),
      process.env.ANALYZE ? analyzer() : null,
    ].filter(Boolean as unknown as <T>(x: T) => x is NonNullable<T>),

    optimizeDeps: {
      include: [
        'graphql',
        'expo-linear-gradient',
        'expo-modules-core',
        'react-native-web',
        'react-native-gesture-handler',
        'tamagui',
        '@tamagui/web',
        'ui',
        '@uniswap/sdk-core',
        '@uniswap/v2-sdk',
        '@uniswap/v3-sdk',
        '@uniswap/v4-sdk',
        '@uniswap/router-sdk',
        '@uniswap/universal-router-sdk',
        '@uniswap/uniswapx-sdk',
        '@uniswap/permit2-sdk',
        'jsbi',
        'ethers',
      ],
      // Libraries that shouldn't be pre-bundled
      exclude: ['expo-clipboard'],
      esbuildOptions: {
        resolveExtensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
        loader: {
          '.js': 'jsx',
          '.ts': 'ts',
          '.tsx': 'tsx',
        },
      },
    },

    build: {
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : undefined,
      rollupOptions: {
        external: [/\.stories\.[tj]sx?$/, /\.mdx$/, /expo-clipboard\/build\/ClipboardPasteButton\.js/],
        output: {
          // Ensure consistent file naming for better caching
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Increase the warning limit for larger chunks
      chunkSizeWarningLimit: 800,
      commonjsOptions: {
        include: [/jsbi/, /node_modules/], // force inclusion + conversion of jsbi CJS
      },
    },

    // Support all prefixes (including no prefix)
    envPrefix: [],
  }
})
