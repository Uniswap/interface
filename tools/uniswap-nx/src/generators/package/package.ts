import { addProjectConfiguration, generateFiles, Tree, updateJson } from '@nx/devkit'
import { addTsConfigPath } from '@nx/js'
import { execSync } from 'child_process'
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
  const typesList = options.types.split(',').map((t) => t.trim())
  const types = JSON.stringify(typesList).slice(1, -1) // Remove outer brackets to fit in template
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    ...options,
    relativePathToRoot,
    types,
  })

  // Return a task that formats only the files changed by this generator
  return () => {
    // Get only the files that were changed by this generator
    const changedFiles = tree.listChanges().map(change => change.path).join(' ')

    if (!changedFiles) {
      return
    }

    try {
      console.log('Formatting generated files with Biome...')
      // Run biome directly on just the files changed by this generator
      execSync(`bun biome format --write ${changedFiles}`, {
        stdio: 'inherit',
      })
    } catch (error) {
      console.warn('Could not format files. You may need to run "bun g:format" manually.')
    }
  }
}

export default packageGenerator
