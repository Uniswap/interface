import { addProjectConfiguration, generateFiles, Tree, updateJson } from '@nx/devkit'
import { addTsConfigPath } from '@nx/js'
import * as path from 'path'
import { PackageGeneratorSchema } from './schema'

export async function packageGenerator(tree: Tree, options: PackageGeneratorSchema) {
  if (!/^[a-z0-9-]+$/.test(options.name)) {
    throw new Error(`Invalid package name "${options.name}". Use lowercase letters, numbers, and hyphens only.`)
  }
  options.path = options.path ?? `packages/${options.name}`
  options.types = options.types ?? 'node'
  const projectRoot = options.path
  addProjectConfiguration(tree, options.name, {
    root: projectRoot,
    projectType: 'library',
    sourceRoot: `${projectRoot}/src`,
    targets: {},
  })
  addTsConfigPath(tree, `@universe/${options.name}/*`, [`${projectRoot}/*`])
  updateJson(tree, 'package.json', (json) => {
    json.scripts = json.scripts ?? {}
    json.scripts[options.name] = json.scripts[options.name] ?? `bun run --cwd ${projectRoot}`
    return json
  })
  const relativePathToRoot = path.relative(options.path, '')
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    ...options,
    relativePathToRoot,
    types: options.types
      .split(',')
      .map((t) => `"${t.trim()}"`)
      .join(', '),
  })
}

export default packageGenerator
