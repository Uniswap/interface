const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const withStorybook = require('@storybook/react-native/metro/withStorybook')
const { mergeConfig } = require('@react-native/metro-config')
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

const defaultConfig = getExpoDefaultConfig(__dirname)

const {
  resolver: { sourceExts, assetExts },
} = defaultConfig

// Only customize necessary fields for SVG and Storybook support
const customConfig = {
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'cjs'],
  },
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    // Hermes runs async/await, generators, etc. natively. Without this the babel preset falls back to
    // the 'default' profile and regenerator-transpiles async, yielding promises that fail
    // `instanceof Promise` against Hermes' native Promise (a Promise-identity split).
    unstable_transformProfile: 'hermes-stable',
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

const IS_STORYBOOK_ENABLED = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'

const finalConfig = withStorybook(mergeConfig(getExpoDefaultConfig(__dirname), defaultConfig, customConfig), {
  enabled: IS_STORYBOOK_ENABLED,
  onDisabledRemoveStorybook: true,
  configPath: path.resolve(__dirname, './.storybook'),
})

// @hpke/* CJS bundles use a UMD wrapper where `require` is a parameter binding,
// which Metro's scope-aware dependency collector skips — so transitive requires
// like `require("@hpke/common")` are never registered and fail at runtime with
// `Unknown named module`. The ESM entries use static `export ... from` and are
// fully analyzable. Point Metro at them directly.
const hpkeBypass = {
  '@hpke/common': path.resolve(__dirname, '../../node_modules/@hpke/common/esm/mod.js'),
  '@hpke/core': path.resolve(__dirname, '../../node_modules/@hpke/core/esm/mod.js'),
  '@hpke/chacha20poly1305': path.resolve(__dirname, '../../node_modules/@hpke/chacha20poly1305/esm/mod.js'),
}

const prevResolveRequest = finalConfig.resolver.resolveRequest
finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  const mapped = hpkeBypass[moduleName]
  if (mapped) {
    return { type: 'sourceFile', filePath: mapped }
  }
  // jose is pulled in transitively by `@privy-io/js-sdk-core` (used by
  // `@privy-io/expo`). It ships Node CJS (uses `zlib`, `util`) and browser
  // (uses WebCrypto) builds. Metro's default resolver picks CJS via the
  // `require` export condition, which blows up on RN because Node stdlib
  // isn't available. Redirect to the browser build — WebCrypto is polyfilled
  // in src/polyfills/index.ts via react-native-quick-crypto.
  if (moduleName === 'jose') {
    const resolved = prevResolveRequest
      ? prevResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform)
    if (resolved?.type === 'sourceFile' && resolved.filePath.includes('/dist/node/cjs/')) {
      return {
        ...resolved,
        filePath: resolved.filePath.replace('/dist/node/cjs/', '/dist/browser/'),
      }
    }
    return resolved
  }
  // The monorepo pins zod to v4, but @privy-io/* was built against zod v3
  // (schemas call `z.enum(...).Values.X`, a v3 API). Zod v4 ships a v3 compat
  // layer at `zod/v3` — route Privy's `require("zod")` there so its schemas
  // resolve, while the rest of the app keeps using v4.
  if (moduleName === 'zod' && context.originModulePath && context.originModulePath.includes('/@privy-io/')) {
    return prevResolveRequest
      ? prevResolveRequest(context, 'zod/v3', platform)
      : context.resolveRequest(context, 'zod/v3', platform)
  }
  if (prevResolveRequest) {
    return prevResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

// Env values are inlined into modules by transform-inline-environment-variables and then
// baked into Metro's per-module transform cache. Metro doesn't key that cache on .env file
// contents, so editing them leaves stale values in cached modules until `--reset-cache`.
// Fold a hash of those files into Metro's cacheVersion so any change busts the cache
// automatically. The file list must mirror what babel.config.js loads for the active mode.
function getEnvCacheVersion() {
  const envFiles = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '.env.dev'),
    path.resolve(__dirname, '.env.override'),
  ]
  const hash = crypto.createHash('md5')
  for (const filePath of envFiles) {
    if (fs.existsSync(filePath)) {
      hash.update(filePath)
      hash.update(fs.readFileSync(filePath))
    }
  }
  return `env-${hash.digest('hex').slice(0, 16)}`
}

// Bust Metro's transform cache whenever the env files change (see getEnvCacheVersion).
// Append to any existing cacheVersion rather than overwriting it.
finalConfig.cacheVersion = [finalConfig.cacheVersion, getEnvCacheVersion()].filter(Boolean).join('-')

// uniwind (Tailwind v4 for React Native) must be the OUTERMOST wrapper. It sets
// `transformerPath` (not `transformer.babelTransformerPath`), so the existing
// react-native-svg-transformer is preserved — uniwind's transformer delegates
// non-CSS files to the upstream Expo/Metro worker, which still honors it. It also
// spreads the existing resolver, keeping the @hpke/jose/zod resolveRequest chain.
module.exports = withUniwindConfig(finalConfig, {
  cssEntryFile: './src/global.css',
})
