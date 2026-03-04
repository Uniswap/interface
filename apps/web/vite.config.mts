import { cloudflare } from '@cloudflare/vite-plugin'
import { tamaguiPlugin } from '@tamagui/vite-plugin'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { config as dotenvConfig } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { createHash } from 'node:crypto'
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
import {createEntryGatewayProxy} from './vite/entry-gateway-proxy'

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// When the private embedded wallet package is not installed,
// externalize it so Rollup doesn't fail to resolve dynamic imports at build time.
// At runtime, the dynamic import will fail and the try/catch in loadPrivyPbModule() provides
// a clear error message: "Embedded Wallet requires @uniswap/client-privy-embedded-wallet".
const privyPackageInstalled = fs.existsSync(
  path.resolve(__dirname, '../../node_modules/@uniswap/client-privy-embedded-wallet'),
)
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === 'true'
const ReactCompilerConfig = {
  target: '18', // '17' | '18' | '19'
}
const DEPLOY_TARGET = process.env.DEPLOY_TARGET || 'cloudflare'
const VITE_DISABLE_SOURCEMAP = process.env.VITE_DISABLE_SOURCEMAP === 'true'
const DEBUG_PROXY = process.env.VITE_DEBUG_PROXY === 'true'
const ENABLE_PROXY = process.env.VITE_ENABLE_ENTRY_GATEWAY_PROXY === 'true'

const DEFAULT_PORT = 3000

/**
 * Vite's optimizeDeps cache hash doesn't include `define` values, so changing env vars
 * (which are injected via `define` as `process.env.X` replacements) won't invalidate the
 * pre-bundled deps cache. This compares a hash of the resolved env defines against a stored
 * hash and forces a re-bundle only when env values actually changed.
 */
function shouldInvalidateOptimizeDepsForEnv({
  defines,
  cacheDir,
}: {
  defines: Record<string, unknown>
  cacheDir: string
}): boolean {
  const hash = createHash('md5').update(JSON.stringify(defines)).digest('hex').slice(0, 16)
  const hashFile = path.join(cacheDir, '.env-defines-hash')

  try {
    if (fs.existsSync(hashFile)) {
      const stored = fs.readFileSync(hashFile, 'utf-8').trim()
      if (stored === hash) {
        return false
      }
    }
  } catch {
    return true
  }

  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    fs.writeFileSync(hashFile, hash)
  } catch {
    return true
  }

  return true
}

const reactPlugin = () =>
  ENABLE_REACT_COMPILER
    ? react({
        babel: {
          plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
        },
      })
    : react()

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

  // Force load .env.[mode] files since NX ignores them
  const modeEnvPath = path.resolve(__dirname, `.env.${mode}`)
  if (fs.existsSync(modeEnvPath)) {
    try {
      const result = dotenvConfig({ path: modeEnvPath })
      if (result.parsed) {
        // Override base values with mode-specific values
        Object.assign(env, result.parsed)
      }
      if (result.error) {
        console.warn(`Warning: Failed to parse ${modeEnvPath}:`, result.error.message)
      }
    } catch (error) {
      console.warn(`Warning: Failed to read ${modeEnvPath}:`, error.message)
    }
  }

  // Env vars that should be overridable from Vercel/CI (process.env takes precedence over .env files)
  const VERCEL_OVERRIDABLE_ENV_VARS = [
    'UNISWAP_GATEWAY_DNS',
    'API_BASE_URL_V2_OVERRIDE',
    'ENTRY_GATEWAY_API_URL_OVERRIDE',
  ]
  for (const key of VERCEL_OVERRIDABLE_ENV_VARS) {
    if (process.env[key]) {
      env[key] = process.env[key]
    }
  }

  // Log environment loading for CI verification
  console.log(`ENV_LOADED: mode=${mode} REACT_APP_AWS_API_ENDPOINT=${env.REACT_APP_AWS_API_ENDPOINT}`)

  const isProduction = mode === 'production'
  const isStaging = mode === 'staging'
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
    // Force JSBI to use ESM build so transform plugin can add __esModule marker
    jsbi: path.resolve(__dirname, '../../node_modules/jsbi/dist/jsbi.mjs'),
  }

  // Aliases that need exact matching (using resolve.alias array format)
  const exactAliases = [
    // Use web app-specific i18n entry that doesn't import wallet's i18n-setup (exact match only)
    {
      find: /^uniswap\/src\/i18n$/,
      replacement: path.resolve(__dirname, '../../packages/uniswap/src/i18n/index.web-app.ts'),
    },
  ]

  // Create process.env definitions for ALL environment variables
  const envDefines = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
  )

  const defines = {
    __DEV__: !isProduction,
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.EXPO_OS': JSON.stringify('web'),
    'process.env.REACT_APP_GIT_COMMIT_HASH': JSON.stringify(commitHash),
    'process.env.REACT_APP_STAGING': JSON.stringify(mode === 'staging'),
    'process.env.REACT_APP_WEB_BUILD_TYPE': JSON.stringify('vite'),
    // Enable Tamagui's global z-index stacking to fix modal stacking issues
    'process.env.TAMAGUI_STACK_Z_INDEX_GLOBAL': JSON.stringify('true'),
    ...envDefines,
  }

  const cacheDir = path.resolve(__dirname, 'node_modules/.vite')
  const forceOptimize = shouldInvalidateOptimizeDepsForEnv({ defines, cacheDir })

  return {
    root,

    define: defines,

    resolve: {
      // .web-app file extensions take priority over .web for web app-specific overrides
      extensions: ['.web-app.tsx', '.web-app.ts', '.web-app.js', '.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
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
      alias: [
        ...exactAliases,
        ...Object.entries(overrides).map(([find, replacement]) => ({ find, replacement })),
      ],
    },

    plugins: [
      // Fix JSBI ESM interop issue:
      // Rollup's interop wrapper checks for __esModule and passes through if present.
      // JSBI's pure ESM build doesn't have __esModule, so Rollup creates a proxy wrapper
      // that loses static methods like BigInt(). By adding __esModule as a named export,
      // the module namespace will include it, and the interop function returns the module
      // as-is, preserving all static methods.
      {
        name: 'jsbi-esm-interop-fix',
        enforce: 'pre' as const,
        transform(code: string, id: string) {
          // Only transform the JSBI ESM module
          if (!id.includes('node_modules/jsbi/dist/jsbi.mjs')) {
            return null
          }

          // Add __esModule as a named export so Rollup's interop passes it through
          // The interop checks: hasOwnProperty(moduleNamespace, "__esModule")
          // By exporting it, it will be a property on the module namespace object
          return {
            code: `${code}\nexport const __esModule = true;`,
            map: null,
          }
        },
      },
      {
        name: 'transform-react-native-jsx',
        async transform(code: string, id: string) {
          // Transform JSX in react-native libraries that ship JSX in .js files
          const needsJsxTransform = [
            'node_modules/react-native-reanimated',
            'node_modules/expo-blur'  // In case it's not fully mocked
          ].some(path => id.includes(path))

          if (!needsJsxTransform || !id.endsWith('.js')) {
            return null
          }

          // Dynamic import to avoid top-level import issues
          const { transformWithEsbuild } = await import('vite')

          // Use Vite's transformWithEsbuild to handle JSX
          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          })
        },
      },
      portWarningPlugin(isProduction),
      reactPlugin(),
      isProduction || isStaging
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
      env.REACT_APP_SKIP_CSP ? undefined : cspMetaTagPlugin(mode),
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
              { name: 'assets/index-*.js', limit: '2.40 MB', mode: 'gzip' },
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
      force: forceOptimize,
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
      exclude: ['expo-clipboard', '@connectrpc/connect'],
      esbuildOptions: {
        resolveExtensions: ['.web-app.js', '.web-app.ts', '.web-app.tsx', '.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
        loader: {
          '.js': 'jsx',
          '.ts': 'ts',
          '.tsx': 'tsx',
        },
      },
    },

    server: {
      port: DEFAULT_PORT,
      proxy: {
        '/config': {
          target: 'https://gating.interface.gateway.uniswap.org',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/config/, '/v1/statsig-proxy'),
        },
        ...(ENABLE_PROXY ? { '/entry-gateway': createEntryGatewayProxy({ getLogger }) } : {}),
      },
    },

    build: {
      outDir: 'build',
      sourcemap: VITE_DISABLE_SOURCEMAP ? false : (isProduction && !isVercelDeploy ? 'hidden' : true),
      minify: isProduction && !isVercelDeploy ? 'esbuild' : undefined,
      rollupOptions: {
        external: [
          /\.stories\.[tj]sx?$/,
          /\.mdx$/,
          /expo-clipboard\/build\/ClipboardPasteButton\.js/,
          // When the private package is not installed, externalize it so Rollup doesn't error.
          // Dynamic imports of this module will fail at runtime (caught by loadPrivyPbModule's try/catch).
          ...(!privyPackageInstalled ? [/^@uniswap\/client-privy-embedded-wallet/] : []),
        ],
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
        include: [/node_modules/],
      },
    },

    // Support all prefixes (including no prefix)
    envPrefix: [],

    preview: {
      port: 3000,
    },
  }
})

function getLogger(): { log: typeof console.log } {
  return { log: DEBUG_PROXY ? console.log : () => {} }
}
