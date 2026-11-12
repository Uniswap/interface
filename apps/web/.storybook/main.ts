import { fileURLToPath } from 'node:url'
import { createMainConfig } from 'storybook-presets/main'

// The combined catalog: CI tests it and Chromatic publishes it.
export default createMainConfig({
  stories: [
    '../../../packages/mycelium/src/**/*.stories.?(ts|tsx)',
    '../../../packages/ui/**/*.mdx',
    '../../../packages/uniswap/src/**/*.stories.?(ts|tsx|js|jsx)',
    '../../../packages/transactions-ui/src/**/*.stories.?(ts|tsx|js|jsx)',
  ],
  viteConfigPath: fileURLToPath(new URL('./vite.config.mts', import.meta.url)),
  addons: ['@chromatic-com/storybook'],
  staticDirs: ['../public'],
})
