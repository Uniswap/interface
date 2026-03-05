import { createHash } from 'node:crypto'
import fs from 'fs'
import path from 'path'
import { loadEnv, transformWithEsbuild } from 'vite'
import commonjs from 'vite-plugin-commonjs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'wxt'
import { getTsconfigAliases } from './config/getTsconfigAliases'

const icons = {
  16: 'assets/icon16.png',
  32: 'assets/icon32.png',
  48: 'assets/icon48.png',
  128: 'assets/icon128.png',
}

function getPublicAssetsVariant(): 'prod' | 'beta' | 'dev' | 'local' {
  if (process.env.NODE_ENV === 'development') {
    return 'local'
  }
  if (process.env.BUILD_ENV === 'dev') {
    return 'dev'
  }
  if (process.env.BUILD_ENV === 'beta') {
    return 'beta'
  }
  return 'prod'
}

const publicAssetsVariant = getPublicAssetsVariant()

const BASE_NAME = 'Uniswap Extension'
const BASE_DESCRIPTION = "The Uniswap Extension is a self-custody crypto wallet that's built for swapping."
const BASE_VERSION = '1.67.1'

const BUILD_NUM = parseInt(process.env.BUILD_NUM || '0')
const EXTENSION_VERSION = `${BASE_VERSION}.${BUILD_NUM}`

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

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  // WXT Configuration
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  publicDir: 'src/public',

  // Use absolute output directory if specified via environment variable
  outDir: process.env.WXT_ABSOLUTE_OUTDIR || undefined,

  // Remove browser/version subdirectory when using absolute paths
  outDirTemplate: process.env.WXT_ABSOLUTE_OUTDIR ? '' : undefined,

  imports: false,
  // Enable React support
  modules: ['@wxt-dev/module-react'],

  hooks: {
    // Hook for dynamic asset copying based on build variant.
    // All assets in `src/publicAssetsByEnv/<variant>` will be copied to `assets/<name>` at build time.
    'build:publicAssets': (_wxt, files) => {
      const envDir = path.resolve(import.meta.dirname, 'src/publicAssetsByEnv', publicAssetsVariant)
      const entries = fs.readdirSync(envDir)
      for (const entry of entries) {
        const absoluteSrc = path.resolve(envDir, entry)
        if (fs.statSync(absoluteSrc).isFile()) {
          files.push({
            relativeDest: `assets/${entry}`,
            absoluteSrc,
          })
        }
      }
    },
    // Validate build output after dev builds complete
    'build:done': async (wxt) => {
      // Only validate in development mode (dev server)
      if (wxt.config.mode !== 'development') {
        return
      }
      const { execSync } = await import('node:child_process')
      try {
        // Run script directly to avoid Nx dependsOn chain that would trigger a full rebuild
        execSync('bunx tsx scripts/validateBuildOutput.ts --dev', {
          cwd: wxt.config.root,
          stdio: 'inherit',
        })
      } catch {
        // biome-ignore lint/suspicious/noConsole: CLI output for build validation
        console.error('Build validation failed!')
        process.exit(1)
      }
    },
  },

  // Dynamic manifest generation
  manifest: (env) => {
    // BUILD_ENV logic: no build_env for dev command, otherwise use vite build mode
    const isDevelopment = process.env.NODE_ENV === 'development'
    const BUILD_ENV = isDevelopment ? undefined : process.env.BUILD_ENV

    // Extension name postfix
    const EXTENSION_NAME_POSTFIX = isDevelopment
      ? 'LOCAL'
      : BUILD_ENV === 'dev'
        ? 'DEV'
        : BUILD_ENV === 'beta'
          ? 'BETA'
          : ''

    // Name logic: some builds don't have names (when postfix is empty)
    const name = EXTENSION_NAME_POSTFIX ? `${BASE_NAME} ${EXTENSION_NAME_POSTFIX}` : BASE_NAME

    // Extension description logic
    let description = BASE_DESCRIPTION
    if (BUILD_ENV === 'beta') {
      description = 'THIS EXTENSION IS FOR BETA TESTING'
    }
    if (BUILD_ENV === 'dev') {
      description = 'THIS EXTENSION IS FOR DEV TESTING'
    }

    return {
      name,
      description,
      version: EXTENSION_VERSION,
      minimum_chrome_version: '116',

      // Icons configuration
      icons,

      // Action configuration - needed for chrome.action API
      action: {
        default_icon: icons,
      },

      content_scripts: [
        {
          id: 'injected',
          run_at: 'document_start',
          matches:
            isDevelopment || BUILD_ENV === 'dev'
              ? ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*']
              : ['https://*/*'],
          js: ['content-scripts/injected.js'],
        },
        {
          id: 'ethereum',
          run_at: 'document_start',
          matches:
            isDevelopment || BUILD_ENV === 'dev'
              ? ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*']
              : ['https://*/*'],
          js: ['content-scripts/ethereum.js'],
          world: 'MAIN',
        },
      ],

      // Permissions
      permissions: ['alarms', 'notifications', 'sidePanel', 'storage', 'tabs'],

      commands: {
        _execute_action: {
          suggested_key: {
            default: 'Ctrl+Shift+U',
            mac: 'Command+Shift+U',
          },
          description: 'Toggles the sidebar',
        },
      },

      // External connectivity
      externally_connectable: {
        ids: [],
        matches:
          BUILD_ENV === 'prod'
            ? ['https://app.uniswap.org/*']
            : ['https://app.uniswap.org/*', 'https://ew.unihq.org/*', 'https://*.ew.unihq.org/*'],
      },
    }
  },

  // Vite configuration copied from web project
  vite: (env) => {
    // Load ALL env variables (including those without VITE_ prefix)
    const envVars = loadEnv(env.mode, process.cwd(), '')

    const __dirname = path.dirname(new URL(import.meta.url).pathname)
    const isProduction = process.env.NODE_ENV === 'production'
    const isPreparePhase = process.env.WXT_PREPARE === 'true'

    // Create process.env definitions for ALL environment variables
    const envDefines = Object.fromEntries(
      Object.entries(envVars).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
    )

    const defines = {
      __DEV__: !isProduction,
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG || '0'),
      'process.env.VERSION': JSON.stringify(EXTENSION_VERSION),
      'process.env.IS_STATIC': '""',
      'process.env.EXPO_OS': '"web"',
      ...envDefines,
      'process.env.REACT_APP_IS_UNISWAP_INTERFACE': '"false"',
      'process.env.IS_UNISWAP_EXTENSION': '"true"',
    }

    const cacheDir = path.resolve(__dirname, 'node_modules/.vite')
    const forceOptimize = shouldInvalidateOptimizeDepsForEnv({ defines, cacheDir })

    // External package aliases from web config
    const overrides = {
      buffer: 'buffer',
      // External package aliases
      'react-native': 'react-native-web',
      // Skip expo-crypto alias during prepare phase since it imports react-native-web
      crypto: isPreparePhase ? 'crypto' : 'expo-crypto',
      'expo-clipboard': path.resolve(__dirname, '../web/src/lib/expo-clipboard.jsx'),
      jsbi: path.resolve(__dirname, '../../node_modules/jsbi/dist/jsbi.mjs'), // force consistent ESM build
      // Dynamically load all monorepo package aliases from tsconfig.base.json
      ...getTsconfigAliases(),
    }

    return {
      define: defines,

      resolve: {
        extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
        preserveSymlinks: true,
        modules: [path.resolve(__dirname, 'node_modules')],
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
          'react',
          'react-dom',
          'react-router',
          'cookie',
        ],
        alias: {
          ...overrides,
        },
      },

      plugins: [
        {
          name: 'transform-react-native-jsx',
          async transform(code, id) {
            // Transform JSX in react-native libraries that ship JSX in .js files
            const needsJsxTransform = ['node_modules/expo-blur', 'node_modules/react-native-reanimated'].some((path) =>
              id.includes(path),
            )

            if (!needsJsxTransform || !id.endsWith('.js')) {
              return null
            }

            // Use Vite's transformWithEsbuild to handle JSX
            return transformWithEsbuild(code, id, {
              loader: 'jsx',
              jsx: 'automatic',
            })
          },
        },
        tsconfigPaths({
          // ignores tsconfig files in Nx generator template directories
          skip: (dir) => dir.includes('files'),
        }),
        // TODO(INFRA-299): enable tamagui in production once building works
        // !isPreparePhase && isProduction
        //   ? tamaguiPlugin({
        //       config: '../../packages/ui/src/tamagui.config.ts',
        //       components: ['ui', 'uniswap', 'utilities'],
        //       optimize: true,
        //       importsWhitelist: ['constants.js'],
        //     })
        //   : undefined,
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
        // SVG import fix from web config
        {
          name: 'svg-import-fix',
          transform(code: string) {
            const regex = /import\s+([a-zA-Z0-9_$]+)\s+from\s+['"]([^'"]+\.svg)['"]/g
            const transformed = code.replace(regex, (match, varName, path) => {
              if (match.includes('{')) {
                return match
              }
              if (path.includes('?')) {
                return match
              }
              return `import ${varName} from '${path}?url'`
            })
            return transformed === code ? null : transformed
          },
        },
        nodePolyfills({
          globals: {
            process: true,
          },
        }),
        commonjs({
          dynamic: {
            loose: false,
          },
        }),
      ].filter(Boolean),

      optimizeDeps: {
        force: forceOptimize,
        entries: [],
        // noDiscovery: true,
        include: [
          'buffer',
          'graphql',
          'expo-linear-gradient',
          'expo-blur',
          'expo-modules-core',
          'react-native-web',
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
          'react-router',
          'cookie',
          'cookie-es',
          'void-elements',
          'semver',
          'eventemitter3',
          'html-parse-stringify',
          'dayjs',
          'js-sha3',
          'hash.js',
          'elliptic',
          'bn.js',
        ],
        exclude: ['expo-clipboard', 'vite-plugin-node-polyfills'],
        rollupOptions: {
          resolve: {
            extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
          },
        },
        esbuildOptions: {
          loader: {
            '.js': 'jsx',
            '.ts': 'ts',
            '.tsx': 'tsx',
          },
        },
      },

      build: {
        sourcemap: isProduction ? false : 'hidden',
        minify: isProduction ? 'esbuild' : undefined,
        rollupOptions: {
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
        chunkSizeWarningLimit: 800,
        commonjsOptions: {
          include: [/buffer/, /jsbi/, /node_modules/, /cookie/, /void-elements/, /@apollo\/client/],
          transformMixedEsModules: true,
        },
      },

      // Support all prefixes (including no prefix)
      envPrefix: [],
    }
  },

  // Development server configuration
  dev: {
    server: {
      port: 9998, // Different from webpack (9997) to avoid conflicts
    },
  },

  // Do not edit these defaults. Instead create the file apps/extension/web-ext.config.ts to override them.
  // See the README for more information.
  // https://wxt.dev/guide/essentials/config/browser-startup.html
  webExt: {
    startUrls: ['https://app.uniswap.org'],

    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],

    // Optional: Open devtools in the browser automatically
    // openDevtools: true,

    // Save profile changes between builds.
    keepProfileChanges: true,
    // Optional: Firefox profile for Firefox development
    firefoxProfile: './.wxt/firefox-data',
  },
})
