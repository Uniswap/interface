import path from 'path'
import { withRnPrimitives } from 'vitest-presets/vitest/rn-primitives.js'
import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'
import { defineConfig } from 'vitest/config'

const nodeModules = path.resolve(__dirname, '../../node_modules')

// The vitest.config.ts suite, resolved like Metro on iOS: `.ios` and `.native` legs before the
// base file, never `.web`. Mycelium's native legs render through react-native-web under jsdom.
// Wiring mirrors apps/mobile/vitest.config.ts, the other native-first config.
const config = defineConfig({
  ...vitestPreset,
  test: {
    ...vitestPreset.test,
    // Package tooling reads files from disk, so resolution changes nothing for it.
    exclude: [...(vitestPreset.test?.exclude ?? []), '**/*.web.test.*', 'src/scripts/**'],
    setupFiles: [vitestPreset.test?.setupFiles ?? [], './vitest-setup.ts', './vitest-setup-native.ts'].flat(),
    server: {
      deps: {
        // uniwind imports bare `react-native` (Flow source). Inlining sends it through vite so
        // the react-native-web alias applies. Pairs with the uniwind alias below.
        inline: [/node_modules\/uniwind\//],
      },
    },
  },
  resolve: {
    ...vitestPreset.resolve,
    extensions: ['.ios.ts', '.ios.tsx', '.native.ts', '.native.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: [
      // uniwind's default export is its web core, which needs CSSOM that jsdom lacks. Use the
      // native source, the package's `react-native` condition target.
      { find: /^uniwind$/, replacement: path.join(nodeModules, 'uniwind/src/index.ts') },
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],
  },
})

export default withRnPrimitives(config, 'native')
