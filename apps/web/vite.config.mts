import { execSync } from 'child_process'
import fs from 'fs'
import { createHash } from 'node:crypto'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tamaguiPlugin } from '@tamagui/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, type ViteDevServer } from 'vite'
import bundlesize from 'vite-plugin-bundlesize'
import commonjs from 'vite-plugin-commonjs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import { createEntryGatewayProxies } from './vite/entry-gateway-proxy'
import { generateAssetsIgnorePlugin } from './vite/generateAssetsIgnorePlugin.js'
import { resolveEnvConfigs } from './vite/resolveEnvConfigs'
import { cspMetaTagPlugin } from './vite/vite.plugins.js'

// process.env.APP_ID is injected into the browser bundle via envDefines below and set
// here for the Node-side Tamagui static extractor — resolveEnvConfigs() returns an env
// object and only mutates process.env for the keys it resolves, not APP_ID.
process.env.APP_ID = 'web'

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === 'true'
const ReactCompilerConfig = {
  target: '18', // '17' | '18' | '19'
}
const DEPLOY_TARGET = process.env.DEPLOY_TARGET
const DISABLE_SOURCEMAP = (process.env.DISABLE_SOURCEMAP ?? process.env.VITE_DISABLE_SOURCEMAP) === 'true'
const DEBUG_PROXY = (process.env.DEBUG_PROXY ?? process.env.VITE_DEBUG_PROXY) === 'true'
const ENABLE_PROXY = (process.env.ENABLE_ENTRY_GATEWAY_PROXY ?? process.env.VITE_ENABLE_ENTRY_GATEWAY_PROXY) === 'true'

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

// Compute next dev version from latest non-RC web/* git tag
function getNextDevVersion(): string {
  try {
    const latestTag = execSync("git tag --list 'web/*' --sort=-version:refname | grep -v '\\-rc\\.' | head -1")
      .toString()
      .trim()
    if (!latestTag) {
      return ''
    }
    const version = latestTag.replace('web/', '')
    const parts = version.split('.').map(Number)
    if (parts.length < 3 || parts.some(isNaN)) {
      return ''
    }
    return `${parts[0]}.${parts[1] + 1}.0`
  } catch {
    return ''
  }
}

export default defineConfig(({ mode, isPreview }) => {
  // Unified config: resolve .env + overrides via the shared utility (the same
  // code the Playwright test runner uses, so the build and runner configs stay identical).
  const env = resolveEnvConfigs({
    rootDir: __dirname,
    isE2eTest: process.env.IS_E2E_TEST === 'true',
    onOverride: (key) => console.log(`ENV_OVERRIDE: ${key}`),
    overrideProcessEnv: true,
  })

  // Stop the Cloudflare plugin's bundled Wrangler from auto-loading .env / .env.local
  // (and emitting "Using vars defined in ..." logs). The .env values are forwarded
  // to the Worker below via the plugin's `config` customizer.
  process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false'

  // Log environment loading for CI verification
  console.log(`ENV_LOADED: mode=${mode} AWS_API_ENDPOINT=${env.AWS_API_ENDPOINT ?? env.REACT_APP_AWS_API_ENDPOINT}`)

  const isProduction = mode === 'production'
  const isStaging = mode === 'staging'
  const isVercelDeploy = DEPLOY_TARGET === 'vercel'
  const isCloudflareDeploy = DEPLOY_TARGET === 'cloudflare'
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
    'process.env.ENVIRONMENT': JSON.stringify(mode),
    'process.env.EXPO_OS': JSON.stringify('web'),
    'process.env.GIT_COMMIT_HASH': JSON.stringify(commitHash),
    // Enable Tamagui's global z-index stacking to fix modal stacking issues
    'process.env.TAMAGUI_STACK_Z_INDEX_GLOBAL': JSON.stringify('true'),
    // So getConfig().isVercelEnvironment is true in the client on Vercel; enables direct staging WS URL to match EGW
    ...(isVercelDeploy ? { 'process.env.VERCEL': JSON.stringify(process.env.VERCEL ?? '0') } : {}),
    ...envDefines,
    // Fallback: compute next version from git tags when not set by CI
    ...(!env.VERSION && !env.REACT_APP_VERSION_TAG
      ? {
          'process.env.VERSION': JSON.stringify(getNextDevVersion()),
        }
      : {}),
  }

  const cacheDir = path.resolve(__dirname, 'node_modules/.vite')
  const forceOptimize = shouldInvalidateOptimizeDepsForEnv({ defines, cacheDir })

  return {
    root,

    define: defines,

    resolve: {
      // .web-app file extensions take priority over .web for web app-specific overrides
      extensions: [
        '.web-app.tsx',
        '.web-app.ts',
        '.web-app.js',
        '.web.tsx',
        '.web.ts',
        '.web.js',
        '.tsx',
        '.ts',
        '.js',
      ],
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
      alias: [...exactAliases, ...Object.entries(overrides).map(([find, replacement]) => ({ find, replacement }))],
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
            'node_modules/expo-blur', // In case it's not fully mocked
          ].some((path) => id.includes(path))

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
      // Tailwind v4 — compiles @import "tailwindcss" + @universe/tailwind tokens.
      // Placed before the Tamagui extractor so CSS is resolved before extraction.
      // Client environment only: CSS is generated exclusively for the browser bundle, and
      // Tailwind's scan/generate transforms must stay out of the Cloudflare Worker
      // environments (app*), where their module-graph work can invalidate worker modules
      // while requests are in flight.
      ...tailwindcss().map((plugin) => ({
        ...plugin,
        applyToEnvironment: (environment: { name: string }) => environment.name === 'client',
      })),
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
      env.SKIP_CSP ? undefined : cspMetaTagPlugin(mode, env),
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
      // nodePolyfills (above) injects its shim imports into every environment via a global esbuild
      // banner, so non-client optimizers must know them up front to avoid a mid-run reload.
      {
        name: 'pre-bundle-node-polyfill-shims-in-worker-environments',
        configEnvironment(name: string) {
          return name === 'client'
            ? null
            : {
                optimizeDeps: {
                  include: [
                    'vite-plugin-node-polyfills/shims/buffer',
                    'vite-plugin-node-polyfills/shims/global',
                    'vite-plugin-node-polyfills/shims/process',
                  ],
                },
              }
        },
      },
      commonjs({
        dynamic: {
          loose: false,
        },
      }),
      isProduction || DISABLE_SOURCEMAP
        ? undefined
        : bundlesize({
            limits: [
              { name: 'assets/index-*.js', limit: '2.40 MB', mode: 'gzip' },
              { name: '**/*', limit: Infinity, mode: 'uncompressed' },
            ],
          }),
      generateAssetsIgnorePlugin(isProduction && !isVercelDeploy && !DISABLE_SOURCEMAP, __dirname),
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
      // Skip the Cloudflare plugin during `vite preview` — preview only serves
      // static assets, doesn't need worker bindings, and the plugin's
      // getWorkerConfigs enumerates every env in wrangler-vite-worker.jsonc and
      // chokes when one env's build dir is missing (e.g. after switching between
      // build:production and build:staging). See INFRA-1874.
      (isCloudflareDeploy || mode === 'development') && !isPreview
        ? cloudflare({
            configPath: './wrangler-vite-worker.jsonc',
            // Forward .env values to the Worker as vars (the dotenv auto-loader is
            // disabled above). Return only the `vars` patch — the plugin uses defu() to
            // merge, which concatenates arrays. Returning the full workerConfig would
            // duplicate fields like compatibility_flags and crash the Workers runtime at
            // startup. Skip empty strings so any wrangler-defined defaults are preserved.
            config: () => ({
              vars: Object.fromEntries(Object.entries(env).filter(([, value]) => value !== '')),
            }),
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
        'invariant',
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
        'use-resize-observer',
      ],
      // Libraries that shouldn't be pre-bundled
      exclude: [
        'expo-clipboard',
        '@connectrpc/connect',
        '@uniswap/client-liquidity',
        '@uniswap/client-privy-embedded-wallet',
        'expo-modules-core',
      ],
      esbuildOptions: {
        resolveExtensions: [
          '.web-app.js',
          '.web-app.ts',
          '.web-app.tsx',
          '.web.js',
          '.web.ts',
          '.web.tsx',
          '.js',
          '.ts',
          '.tsx',
        ],
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
        ...(ENABLE_PROXY ? createEntryGatewayProxies({ getLogger, env }) : {}),
      },
    },

    build: {
      outDir: 'build',
      sourcemap: DISABLE_SOURCEMAP ? false : isProduction && !isVercelDeploy ? 'hidden' : true,
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
