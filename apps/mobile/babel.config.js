// Load .env files into process.env so transform-inline-environment-variables can inline them.
// This makes process.env.X work in local dev (not just CI where shell env vars are set).
// Must run before Babel plugins are evaluated.
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const newEnvPath = path.resolve(__dirname, '.env')
const devEnvPath = path.resolve(__dirname, '.env.dev')
// Base layer: .env is pulled from the remote config service. When it's absent, fall back
// to the checked-in .env.dev defaults so the app still runs in dev mode. A missing base
// file is not an error: treat it as empty (override + process.env still apply).
const baseEnvPath = fs.existsSync(newEnvPath) ? newEnvPath : devEnvPath
if (baseEnvPath === devEnvPath && fs.existsSync(devEnvPath)) {
  console.log('No .env file located, using the checked in dev defaults')
}
let baseValues = {}
if (fs.existsSync(baseEnvPath)) {
  const result = dotenv.config({ path: baseEnvPath, override: true })
  // Fail fast on bad env file
  if (result.error) {
    throw new Error(`Failed to parse ${baseEnvPath}: ${result.error.message}`)
  }
  baseValues = result.parsed ?? {}
}

// Apply .env.override on top (overrides win), logging every value it overrides.
const overrideEnvPath = path.resolve(__dirname, '.env.override')
if (fs.existsSync(overrideEnvPath)) {
  const overrideResult = dotenv.config({ path: overrideEnvPath, override: true })
  if (overrideResult.error) {
    throw new Error(`Failed to parse ${overrideEnvPath}: ${overrideResult.error.message}`)
  }
  for (const [key, value] of Object.entries(overrideResult.parsed ?? {})) {
    if (key in baseValues && baseValues[key] !== value) {
      console.log(`ENV_OVERRIDE: ${key}`)
    }
  }
}

// process.env.APP_ID is used by @universe/config. When that package's
// getConfig() function is removed, this assignment can be removed.
process.env.APP_ID = 'mobile'

const { NODE_ENV } = process.env

const inProduction = NODE_ENV === 'production'

module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV)

  let plugins = inProduction ? ['transform-remove-console'] : []

  plugins = [
    ...plugins,

    // Disable compiler to fix mobile theme issues and media queries
    // process.env.NODE_ENV === 'test'
    //   ? null
    //   : [
    //       '@tamagui/babel-plugin',
    //       {
    //         components: ['ui'],
    //         // experimentalFlattenThemesOnNative: true,
    //         config: '../../packages/ui/src/tamagui.config.ts',
    //       },
    //     ],

    [
      'module-resolver',
      {
        alias: {
          src: './src',
        },
      },
    ],
    [
      'module:react-native-dotenv',
      {
        // ideally use envName here to add a mobile namespace but this doesn't work when sharing with dotenv-webpack
        moduleName: 'react-native-dotenv',
        path: fs.existsSync(newEnvPath) ? './.env' : './.env.dev',
        safe: true,
        allowUndefined: false,
      },
    ],
    // Don't inline JEST_WORKER_ID: Metro transforms files inside a jest-worker pool that sets it, so
    // inlining bakes a truthy value into the bundle. reanimated reads `!!process.env.JEST_WORKER_ID`
    // for IS_JEST → SHOULD_BE_USE_WEB → its mappers pick the web requestAnimationFrame (a JS remote
    // function) and crash on the UI runtime ("Tried to synchronously call a Remote Function").
    ['transform-inline-environment-variables', { exclude: ['JEST_WORKER_ID'] }],
    // TypeScript compiles this, but in production builds, metro doesn't use tsc
    '@babel/plugin-transform-logical-assignment-operators',
    // metro doesn't like these
    '@babel/plugin-transform-numeric-separator',
    // https://github.com/software-mansion/react-native-reanimated/issues/3364#issuecomment-1268591867
    '@babel/plugin-transform-export-namespace-from',
  ].filter(Boolean)

  return {
    // babel-preset-expo owns the react-native-worklets/plugin (added last, version-matched). Pass our
    // custom worklet globals through it; do NOT add the plugin manually — double-transform breaks worklets.
    presets: [['babel-preset-expo', { worklets: { globals: ['__scanCodes', '__scanOCR'] } }]],
    plugins,
  }
}
