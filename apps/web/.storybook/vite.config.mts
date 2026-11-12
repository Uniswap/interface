import path from 'path'
import { fileURLToPath } from 'url'
import { createStorybookViteConfig } from 'storybook-presets/viteConfig'
import { defineConfig } from 'vite'
import { createWebAliases } from '../vite/moduleResolutions'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig((env) => createStorybookViteConfig(env, { aliases: createWebAliases(webRoot) }))
