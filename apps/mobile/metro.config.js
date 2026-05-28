const path = require('path')
const withStorybook = require('@storybook/react-native/metro/withStorybook')
const { mergeConfig } = require('@react-native/metro-config')
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config')

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

module.exports = finalConfig
