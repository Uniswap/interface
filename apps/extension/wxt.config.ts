import fs from 'fs'
import { createHash } from 'node:crypto'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { parse as parseDotEnv } from 'dotenv'
import { transformWithEsbuild } from 'vite'
import commonjs from 'vite-plugin-commonjs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'wxt'
import { getTsconfigAliases } from './config/getTsconfigAliases'

// process.env.APP_ID is used by @universe/config. Set at the Node level so the
// Tamagui static extractor can resolve it.
process.env.APP_ID = 'extension'

const NEW_ENV_PATH = path.resolve(import.meta.dirname, '.env')
const NEW_ENV_DEV_PATH = path.resolve(import.meta.dirname, '.env.dev')
const NEW_ENV_OVERRIDE_PATH = path.resolve(import.meta.dirname, '.env.override')

function parseEnvFile(filePath: string): Record<string, string> {
  return parseDotEnv(fs.readFileSync(filePath))
}

function buildNewConfigsEnv(): Record<string, string> {
  // Base layer: .env is pulled from the remote config service. When it's absent
  // fall back to the checked-in .env.dev defaults so the extension still runs in dev mode.
  const baseEnvPath = fs.existsSync(NEW_ENV_PATH) ? NEW_ENV_PATH : NEW_ENV_DEV_PATH
  if (baseEnvPath === NEW_ENV_DEV_PATH) {
    console.log('No .env file located, using the checked in dev defaults')
  }
  const envVars = fs.existsSync(baseEnvPath) ? parseEnvFile(baseEnvPath) : {}

  // Apply .env.override on top, logging every value it overrides
  if (fs.existsSync(NEW_ENV_OVERRIDE_PATH)) {
    const overrideVars = parseEnvFile(NEW_ENV_OVERRIDE_PATH)
    for (const [key, value] of Object.entries(overrideVars)) {
      if (key in envVars && envVars[key] !== value) {
        console.log(`ENV_OVERRIDE: ${key}`)
      }
      envVars[key] = value
    }
  }

  return envVars
}

const NEW_CONFIGS_ENV = buildNewConfigsEnv()

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
const BASE_VERSION = '1.79.0'

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

// oxlint-disable-next-line import/no-unused-modules
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
    // Post-process generated manifest to add content_script `id` fields. WXT's
    // `defineContentScript()` doesn't expose an `id` option (as of 0.20.x), so we inject
    // it here based on the js filename.
    // See https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts#id
    'build:manifestGenerated': (_wxt, manifest) => {
      if (!manifest.content_scripts) {
        return
      }
      for (const cs of manifest.content_scripts) {
        if (cs.id) {
          continue
        }
        const jsFile = cs.js?.[0]
        if (!jsFile) {
          continue
        }
        // Examples: 'content-scripts/injected.js' -> 'injected'
        const base = path.basename(jsFile, '.js')
        cs.id = base
      }
    },
    // (previously a manualChunks hook was here to route background-reachable modules into
    // a single chunk; it broke UI entries by forcing cross-chunk imports from sidepanel/
    // onboarding/popup into background.js. Removed once jsbi/env-loading/hashcash fixes
    // eliminated the top-level SW throws that originally motivated the hack.)
    //
    // Rename the IIFE var for main-world content scripts so it doesn't collide with a
    // page global. WXT defaults `build.lib.name` to `safeVarName(entrypoint.name)`, so
    // the ethereum entrypoint (`ethereum.content.ts`) emits `var ethereum = (IIFE)()`
    // at the top level of the MAIN-world content script. In the page's global scope
    // that assignment becomes `window.ethereum = <IIFE return>` AFTER the IIFE body
    // has set `window.ethereum = new WindowEthereumProxy()` — clobbering our proxy
    // with the IIFE's return value (a Promise from WXT's async entry wrapper). Prefix
    // the var name with `__wxt_` to break the collision without changing the entry
    // filename or output path.
    'vite:build:extendConfig': (entrypoints, viteConfig) => {
      const isContentScriptGroup = entrypoints.length === 1 && entrypoints[0]?.type === 'content-script'
      if (!isContentScriptGroup) {
        return
      }
      const entry = entrypoints[0]
      if (!entry) {
        return
      }
      // Only override when Vite is building the content script as a classic IIFE
      // (this is the `build.lib` path WXT takes for content scripts).
      const lib = viteConfig.build?.lib
      if (lib && typeof lib === 'object' && 'name' in lib && typeof lib.name === 'string') {
        lib.name = `__wxt_cs_${lib.name}`
      }
    },
    // Validate build output after every build (dev and production). The script scans for
    // bundler regressions that only surface at runtime — most notably classic
    // `importScripts(` worker chunk loading, which produces the `chunks/chunks/<hash>.js`
    // NetworkError in shipped builds. Skipping production here is how that bug shipped to
    // v1.73.0/v1.74.0 unnoticed, so validation now runs on both modes.
    'build:done': async (wxt) => {
      const { execSync } = await import('node:child_process')
      const modeFlag = wxt.config.mode === 'development' ? '--dev' : '--prod'
      try {
        // Run script directly to avoid Nx dependsOn chain that would trigger a full rebuild
        execSync(`bun run scripts/validateBuildOutput.ts ${modeFlag}`, {
          cwd: wxt.config.root,
          stdio: 'inherit',
        })
      } catch {
        // oxlint-disable-next-line no-console -- CLI output for build validation
        console.error('Build validation failed!')
        process.exit(1)
      }
    },
  },

  // Dynamic manifest generation
  // oxlint-disable-next-line no-unused-vars -- biome-parity: oxlint is stricter here
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

      // Content scripts are auto-registered from `src/entrypoints/*.content.ts` via WXT's
      // `defineContentScript()` export. We used to duplicate them here, which produced four
      // entries in the manifest (two manual + two auto). The `id` field is added by the
      // `build:manifestGenerated` hook above since `defineContentScript()` doesn't accept it.

      // Permissions
      permissions: ['alarms', 'notifications', 'sidePanel', 'storage', 'tabs'],
      host_permissions: ['https://*.uniswap.org/*'],

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
            : ['https://app.uniswap.org/*', 'https://app.corn-staging.com/*', 'https://dev.ew.unihq.org/*'],
      },
    }
  },

  // Vite configuration copied from web project
  vite: () => {
    const __dirname = path.dirname(new URL(import.meta.url).pathname)
    const isProduction = process.env.NODE_ENV === 'production'
    const isPreparePhase = process.env.WXT_PREPARE === 'true'

    // Create process.env definitions for ALL environment variables
    const envDefines = Object.fromEntries(
      Object.entries(NEW_CONFIGS_ENV).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
    )

    const defines = {
      __DEV__: !isProduction,
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG || '0'),
      'process.env.VERSION': JSON.stringify(EXTENSION_VERSION),
      'process.env.IS_STATIC': '""',
      'process.env.EXPO_OS': '"web"',
      // process.env.APP_ID is used by @universe/config. When that package's
      // getConfig() function is removed, this define can be removed.
      'process.env.APP_ID': '"extension"',
      ...envDefines,
    }

    const cacheDir = path.resolve(__dirname, 'node_modules/.vite')
    const forceOptimize = shouldInvalidateOptimizeDepsForEnv({
      defines,
      cacheDir,
    })

    // External package aliases from web config
    const overrides = {
      buffer: 'buffer',
      // External package aliases
      'react-native': 'react-native-web',
      // Skip expo-crypto alias during prepare phase since it imports react-native-web
      crypto: isPreparePhase ? 'crypto' : 'expo-crypto',
      'expo-clipboard': path.resolve(__dirname, '../web/src/lib/expo-clipboard.jsx'),
      // Shim jsbi through a local file that re-exports every static method as a named
      // export. jsbi.mjs itself only has `export default JSBI`, and JSBI's static methods
      // are non-enumerable class members, so Rollup's ESM interop wrapper (__toESM) only
      // surfaces `default`. Code like `import JSBI from 'jsbi'; JSBI.BigInt(0)` bundles
      // to `i.BigInt(0)` where `i` is the namespace without the static methods — runtime
      // TypeError in the service worker at module evaluation time.
      jsbi: path.resolve(__dirname, 'src/shims/jsbi.mjs'),
      // Route the hashcash worker helper to a `?worker`-based variant. Vite's
      // `new Worker(new URL(...))` detection doesn't fire when the URL escapes the Vite
      // root (apps/extension → packages/sessions), so the `?worker` query is used instead.
      'src/workers/hashcashWorker': path.resolve(__dirname, 'src/workers/hashcashWorker.vite'),
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
        // Tailwind v4 — compiles @import "tailwindcss" + @universe/tailwind tokens
        // for the extension's UI pages (sidepanel, onboarding, popup, unitag claim).
        tailwindcss(),
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
            // oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
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
        esbuildOptions: {
          // Prefer .web.* extensions so react-native packages resolve to their web variants
          // (e.g. react-native-svg/ReactNativeSVG.web.js instead of ReactNativeSVG.js which
          // imports Fabric/codegen internals that don't exist on web).
          resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
          loader: {
            '.js': 'jsx',
            '.ts': 'ts',
            '.tsx': 'tsx',
          },
        },
      },

      build: {
        // Always emit hidden sourcemaps. Prod uploads them to Datadog for symbolication; the zip step excludes *.map so they don't ship to users.
        sourcemap: 'hidden',
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

      // Use `format: 'es'` to emit module workers for correct imports in Chrome extensions.
      worker: {
        format: 'es',
        rollupOptions: {
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
      },

      // Support all prefixes (including no prefix)
      envPrefix: [],
    }
  },

  // Development server configuration
  dev: {
    server: {
      port: 9998,
    },
  },

  // Do not edit these defaults. Instead create the file apps/extension/web-ext.config.ts to override them.
  // See the README for more information.
  // https://wxt.dev/guide/essentials/config/browser-startup.html
  webExt: {
    disabled: process.env.WXT_NO_OPEN_BROWSER === 'true',

    startUrls: ['https://app.uniswap.org'],

    chromiumArgs: [`--user-data-dir=${process.env.WXT_CHROME_USER_DATA_DIR ?? './.wxt/chrome-data'}`],

    // Optional: Open devtools in the browser automatically
    // openDevtools: true,

    // Save profile changes between builds.
    keepProfileChanges: true,
    // Optional: Firefox profile for Firefox development
    firefoxProfile: './.wxt/firefox-data',
  },
})
