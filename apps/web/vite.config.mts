import { cloudflare } from '@cloudflare/vite-plugin'
import { tamaguiPlugin } from '@tamagui/vite-plugin'
import react from '@vitejs/plugin-react'
import reactOxc from '@vitejs/plugin-react-oxc'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import bundlesize from 'vite-plugin-bundlesize'
import commonjs from 'vite-plugin-commonjs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import { generateAssetsIgnorePlugin } from './vite/generateAssetsIgnorePlugin.js'
import { cspMetaTagPlugin } from './vite/vite.plugins.js'

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === 'true'
const ReactCompilerConfig = {
  target: '18', // '17' | '18' | '19'
}
const DEPLOY_TARGET = process.env.DEPLOY_TARGET || 'cloudflare'
const VITE_DISABLE_SOURCEMAP = process.env.VITE_DISABLE_SOURCEMAP === 'true'

const DEFAULT_PORT = 3000

const reactPlugin = () =>
  ENABLE_REACT_COMPILER
    ? react({
        babel: {
          plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
        },
      })
    : reactOxc()

// Prints a warning if server automatically switches to a different port when `DEFAULT_PORT` is already in use
const portWarningPlugin = (isProduction: boolean) =>
  isProduction
    ? undefined
    : {
        name: 'port-warning',
        configureServer(server: ViteDevServer) {
          server.httpServer?.once('listening', () => {
            const address = server.httpServer?.address()
            if (address && typeof address === 'object' && address.port !== DEFAULT_PORT) {
              setTimeout(() => {
                console.log('\n')
                console.log('\x1b[41m\x1b[37m' + '═'.repeat(80) + '\x1b[0m')
                console.log('\x1b[41m\x1b[37m' + ' '.repeat(80) + '\x1b[0m')
                console.log('\x1b[41m\x1b[37m' + '  ⚠️  WARNING: Port 3000 is already in use!'.padEnd(80) + '\x1b[0m')
                console.log('\x1b[41m\x1b[37m' + ' '.repeat(80) + '\x1b[0m')
                console.log(
                  '\x1b[41m\x1b[37m' + '  You may have another server instance running.'.padEnd(80) + '\x1b[0m',
                )
                console.log('\x1b[41m\x1b[37m' + ' '.repeat(80) + '\x1b[0m')
                console.log(
                  '\x1b[41m\x1b[37m' +
                    `  The server is running on port ${address.port} instead.`.padEnd(80) +
                    '\x1b[0m',
                )
                console.log('\x1b[41m\x1b[37m' + ' '.repeat(80) + '\x1b[0m')
                console.log('\x1b[41m\x1b[37m' + '═'.repeat(80) + '\x1b[0m')
                console.log('\n')
              }, 100) // Small delay to ensure it appears after Vite's messages
            }
          })
        },
      }

// Get git commit hash
const commitHash = execSync('git rev-parse HEAD').toString().trim()

export default defineConfig(({ mode }) => {
  let env = loadEnv(mode, __dirname, '')

  // Log environment loading for CI verification
  console.log(`ENV_LOADED: mode=${mode} REACT_APP_AWS_API_ENDPOINT=${env.REACT_APP_AWS_API_ENDPOINT}`)

  const isProduction = mode === 'production'
  const isVercelDeploy = DEPLOY_TARGET === 'vercel'
  const root = path.resolve(__dirname)

  // External package aliases only
  const overrides = {
    // External package aliases
    'react-native': 'react-native-web',
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
      'process.env.REACT_APP_GIT_COMMIT_HASH': JSON.stringify(commitHash),
      'process.env.REACT_APP_STAGING': JSON.stringify(mode === 'staging'),
      'process.env.REACT_APP_WEB_BUILD_TYPE': JSON.stringify('vite'),
      ...envDefines,
    },

    resolve: {
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
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
        '@visx/responsive',
        'jsbi',
        'ethers',
        'react',
        'react-dom',
      ],
      alias: {
        ...overrides,
      },
    },

    plugins: [
      portWarningPlugin(isProduction),
      reactPlugin(),
      isProduction
        ? tamaguiPlugin({
            config: '../../packages/ui/src/tamagui.config.ts',
            components: ['ui', 'uniswap', 'utilities'],
            optimize: true,
            importsWhitelist: ['constants.js'],
          })
        : undefined,
      tsconfigPaths({
        // ignores tsconfig files in Nx generator template directories
        skip: (dir) => dir.includes('files'),
      }),
      env.REACT_APP_SKIP_CSP ? undefined : cspMetaTagPlugin(),
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

          // eslint-disable-next-line max-params
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
      isProduction || VITE_DISABLE_SOURCEMAP
        ? undefined
        : bundlesize({
            limits: [
              { name: 'assets/index-*.js', limit: '2.3 MB', mode: 'gzip' },
              { name: '**/*', limit: Infinity, mode: 'uncompressed' },
            ],
          }),
      generateAssetsIgnorePlugin(isProduction && !isVercelDeploy && !VITE_DISABLE_SOURCEMAP, __dirname),
      {
        name: 'copy-twist-config',
        writeBundle() {
          const configMode = isProduction ? 'production' : 'staging'
          const sourceFile = path.resolve(__dirname, `twist-configs/twist.${configMode}.json`)
          const targetFileRoot = path.resolve(__dirname, `build/.well-known/twist.json`)
          const targetFileClient = path.resolve(__dirname, `build/client/.well-known/twist.json`)

          if (fs.existsSync(sourceFile)) {
            // Ensure the .well-known directory exists in build output
            const targetDirRoot = path.dirname(targetFileRoot)
            if (!fs.existsSync(targetDirRoot)) {
              fs.mkdirSync(targetDirRoot, { recursive: true })
            }

            // Ensure the .well-known directory also exists under build/client
            const targetDirClient = path.dirname(targetFileClient)
            if (!fs.existsSync(targetDirClient)) {
              fs.mkdirSync(targetDirClient, { recursive: true })
            }

            // Copy the file directly to the build output
            fs.copyFileSync(sourceFile, targetFileRoot)
            fs.copyFileSync(sourceFile, targetFileClient)
            console.log(`Copied ${configMode} TWIST config to build output (root and client) for env ${mode}`)
          } else {
            console.warn(`${configMode} TWIST config not found for env ${mode}`)
          }
        },
      },
      DEPLOY_TARGET === 'cloudflare' || mode === 'development'
        ? cloudflare({
            configPath: './wrangler-vite-worker.jsonc',
            // Workaround for cloudflare plugin bug: explicitly set environment name based on CLOUDFLARE_ENV
            viteEnvironment:
              process.env.CLOUDFLARE_ENV === 'production'
                ? { name: 'app' }
                : process.env.CLOUDFLARE_ENV === 'staging'
                  ? { name: 'app_staging' }
                  : undefined,
          })
        : undefined,
    ].filter(Boolean as unknown as <T>(x: T) => x is NonNullable<T>),

    optimizeDeps: {
      entries: ['index.html'],
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
        '@visx/responsive',
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

    server: {
      port: DEFAULT_PORT,
    },

    build: {
      outDir: 'build',
      sourcemap: VITE_DISABLE_SOURCEMAP ? false : (isProduction && !isVercelDeploy ? 'hidden' : true),
      minify: isProduction && !isVercelDeploy ? 'esbuild' : undefined,
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

    preview: {
      port: 3000,
    },
  }
})
