import { fileURLToPath } from 'node:url'
import { createStorybookVitestConfig } from 'storybook-presets/vitestConfig'

export default createStorybookVitestConfig({ configDir: fileURLToPath(new URL('.', import.meta.url)) })
