import type { Plugin } from 'vite'
import commonjs from 'vite-plugin-commonjs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'

/** Source transforms for loading the monorepo's cross-platform packages on the web. */

/**
 * Rollup's interop wrapper passes a module through only if it has __esModule. JSBI's pure
 * ESM build doesn't, so Rollup wraps it in a proxy that loses static methods like BigInt().
 * Exporting __esModule puts it on the module namespace, so the interop returns it as-is.
 */
export function jsbiEsmInteropPlugin(): Plugin {
  return {
    name: 'jsbi-esm-interop-fix',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('node_modules/jsbi/dist/jsbi.mjs')) {
        return null
      }
      return {
        code: `${code}\nexport const __esModule = true;`,
        map: null,
      }
    },
  }
}

/** Transforms JSX in react-native libraries that ship it in .js/.mjs files. */
export function reactNativeJsxPlugin(): Plugin {
  return {
    name: 'transform-react-native-jsx',
    async transform(code, id) {
      const needsJsxTransform = [
        'node_modules/react-native-reanimated',
        'node_modules/expo-blur', // In case it's not fully mocked
        'node_modules/@rn-primitives', // tsup dist ships raw JSX in .js/.mjs
      ].some((modulePath) => id.includes(modulePath))

      if (!needsJsxTransform || !/\.(js|mjs)$/.test(id)) {
        return null
      }

      // Dynamic import to avoid top-level import issues
      const { transformWithEsbuild } = await import('vite')

      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
      })
    },
  }
}

export function webSvgrPlugin(): Plugin {
  return svgr({
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
  })
}

/** Rewrites default `.svg` imports to `?url`; named imports like `{ ReactComponent }` go through svgr. */
export function svgImportFixPlugin(): Plugin {
  return {
    name: 'svg-import-fix',
    transform(code) {
      const regex = /import\s+([a-zA-Z0-9_$]+)\s+from\s+['"]([^'"]+\.svg)['"]/g

      const transformed = code.replace(regex, (match, varName: string, importPath: string) => {
        if (match.includes('{')) {
          return match
        }
        // Skip if it already has a query param
        if (importPath.includes('?')) {
          return match
        }
        return `import ${varName} from '${importPath}?url'`
      })

      return transformed === code ? null : transformed
    },
  }
}

export function webNodePolyfillsPlugin(command: 'serve' | 'build'): Plugin[] {
  return nodePolyfills({
    globals: {
      // In dev, `true` injects a per-module `import ... as process` shim that shadows
      // `process`, so rolldown/oxc's scope-aware define skips the `process.env.*`
      // replacements (empty shim env -> config boot crash). `'dev'` instead sets
      // `globalThis.process` via the dep optimizer, keeping defines working; build
      // keeps the module shim (`true`) so prod output is unchanged.
      process: command === 'serve' ? 'dev' : true,
    },
    include: ['path', 'buffer'],
  })
}

/** Converts `require()` in source, e.g. the PNG requires in mycelium's assets. */
export function webCommonjsPlugin(): Plugin {
  return commonjs({
    dynamic: {
      loose: false,
    },
  })
}
