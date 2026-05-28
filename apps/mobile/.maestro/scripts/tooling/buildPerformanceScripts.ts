#!/usr/bin/env ts-node

/**
 * Build script for Maestro performance tracking scripts
 * Uses esbuild to bundle TypeScript files into self-contained JavaScript
 * This compiled Javascript is compatible with the GraalJS runtime
 */

import { build } from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'

const PERFORMANCE_DIR = path.resolve(__dirname, '..', 'performance')
const SRC_DIR = path.join(PERFORMANCE_DIR, 'src')
const DIST_DIR = path.join(PERFORMANCE_DIR, 'dist')

// Ensure dist directories exist
const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

ensureDir(DIST_DIR)

// Recursively find all TypeScript files in a directory
const findTypeScriptFiles = (dir: string): string[] => {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      files.push(...findTypeScriptFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      // Include TypeScript files, but not declaration files
      files.push(fullPath)
    }
  }

  return files
}

// Discover all TypeScript files in src/actions and src/utils
const actionScripts = findTypeScriptFiles(path.join(SRC_DIR, 'actions'))
const utilScripts = findTypeScriptFiles(path.join(SRC_DIR, 'utils'))

// Separate Node.js scripts that need different build settings (need Node.js platform)
const nodeScripts = utilScripts.filter((script) => {
  const basename = path.basename(script, '.ts')
  return basename.includes('extract') || basename.includes('process-metrics')
})

// Filter utility scripts to only those that should be built as GraalJS executables
// Exclude Node.js scripts from this list
const executableUtils = utilScripts.filter((script) => {
  const basename = path.basename(script, '.ts')
  // Only build utilities that are likely to be executed directly (excluding Node.js scripts)
  const isNodeScript = basename.includes('extract') || basename.includes('process-metrics')
  return !isNodeScript && (basename.includes('upload') || basename.includes('submit'))
})

// Ensure output directories exist only for files that will actually be built
const scriptsToBeBuilt = [...actionScripts, ...utilScripts]
const outputDirs = new Set<string>()
for (const script of scriptsToBeBuilt) {
  const relativePath = path.relative(SRC_DIR, script)
  const outputDir = path.join(DIST_DIR, path.dirname(relativePath))
  outputDirs.add(outputDir)
}

for (const dir of outputDirs) {
  ensureDir(dir)
}

interface BuildOptions {
  entryPoint: string
  outfile: string
  isNodeScript?: boolean
}

async function buildScript(options: BuildOptions): Promise<void> {
  const { entryPoint, outfile, isNodeScript = false } = options
  try {
    if (isNodeScript) {
      // Build for Node.js execution (e.g., extract-metrics, process-metrics)
      await build({
        entryPoints: [entryPoint],
        bundle: true,
        outfile,
        platform: 'node',
        target: 'node14',
        format: 'cjs',
        // Don't minify to keep it debuggable
        minify: false,
        // Include source maps for debugging
        sourcemap: true,
        // Node built-ins should be external
        external: ['fs', 'path', 'util', 'child_process', 'readline'],
      })
    } else {
      // Build for GraalJS execution (action scripts)
      await build({
        entryPoints: [entryPoint],
        bundle: true,
        outfile,
        platform: 'neutral',
        target: 'es2015',
        format: 'iife',
        // Note: globalName removed - not valid with dots in identifier
        footer: {
          js: '// GraalJS compatible bundle',
        },
        // Don't minify to keep it debuggable
        minify: false,
        // Include source maps for debugging
        sourcemap: true,
        // Override any external dependencies - we want everything bundled
        external: [],
      })
    }
    console.log(`  ✓ Built ${path.basename(outfile)}`)
  } catch (error) {
    console.error(`  ✗ Failed to build ${path.basename(entryPoint)}:`, error)
    throw error
  }
}

async function main(): Promise<void> {
  console.log('Building performance scripts for GraalJS...')
  console.log()

  // Build action scripts
  if (actionScripts.length > 0) {
    console.log(`Building ${actionScripts.length} action scripts:`)
    for (const entryPoint of actionScripts) {
      const relativePath = path.relative(SRC_DIR, entryPoint)
      const outfile = path.join(DIST_DIR, relativePath.replace('.ts', '.js'))
      await buildScript({ entryPoint, outfile })
    }
  } else {
    console.log('No action scripts found')
  }

  // Build GraalJS utility scripts (excluding Node.js scripts)
  if (executableUtils.length > 0) {
    console.log()
    console.log(`Building ${executableUtils.length} GraalJS utility scripts:`)
    for (const entryPoint of executableUtils) {
      const relativePath = path.relative(SRC_DIR, entryPoint)
      const outfile = path.join(DIST_DIR, relativePath.replace('.ts', '.js'))
      await buildScript({ entryPoint, outfile, isNodeScript: false })
    }
  }

  // Build Node.js scripts with different settings
  if (nodeScripts.length > 0) {
    console.log()
    console.log(`Building ${nodeScripts.length} Node.js scripts:`)
    for (const entryPoint of nodeScripts) {
      const relativePath = path.relative(SRC_DIR, entryPoint)
      const outfile = path.join(DIST_DIR, relativePath.replace('.ts', '.js'))
      await buildScript({ entryPoint, outfile, isNodeScript: true })

      // Add shebang to make it executable (if not already present)
      const content = await fs.promises.readFile(outfile, 'utf-8')
      if (!content.startsWith('#!/usr/bin/env node')) {
        await fs.promises.writeFile(outfile, `#!/usr/bin/env node\n${content}`)
      }
      await fs.promises.chmod(outfile, 0o755)
    }
  }

  console.log()
  console.log(`Build complete! Built ${actionScripts.length + executableUtils.length + nodeScripts.length} files.`)
}

// Run the build
main().catch((error) => {
  console.error('Build failed:', error)
  process.exit(1)
})
