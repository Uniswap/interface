import path from 'path'
import { fileURLToPath } from 'url'
import { createStorybookVitestConfig } from 'storybook-presets/vitestConfig'
import { createWebAliases } from '../vite/moduleResolutions'

const configDir = path.dirname(fileURLToPath(import.meta.url))

export default createStorybookVitestConfig({
  configDir,
  aliases: createWebAliases(path.resolve(configDir, '..')),
  // Mycelium tests its own stories, without the app context this catalog adds.
  exclude: ['../../packages/mycelium/**'],
})
