import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = __dirname

/** Modules that export no component a story could render, each with the reason. */
const EXEMPT_MODULES: Record<string, string> = {
  assets: 'image files, rendered by the media stories that use them',
  compat: 'prop compilers and shared types behind the compat components',
  'floating-overlay': 'native-only; the web leg throws by design',
  portal: 'mounts children elsewhere in the tree; covered by the overlay stories that use it',
  presence: 'enter and exit wrapper; covered by the animation stories that use it',
  shadcn: 'barrel for the shadcn recipes, which are checked file by file',
  styled: 'the styled() factory, not a component',
  testing: 'test doubles and helpers',
  'theme-hooks-compat': 'theme hooks and constants',
}

/**
 * Every component a consumer can import from mycelium has a story, so it's rendered, a11y-checked
 * in both themes and snapshotted. Add a story with a new component, or an exemption with a reason.
 */
describe('stories coverage', () => {
  it.each(getComponentModules().filter((module) => !(module in EXEMPT_MODULES)))(
    'module %s has a stories file',
    (module) => {
      expect(hasStories(join(SRC, module))).toBe(true)
    },
  )

  it.each(getPrimitiveFiles())('%s has a stories file next to it', (file) => {
    expect(existsSync(join(SRC, file.replace(/\.tsx$/, '.stories.tsx')))).toBe(true)
  })

  it('lists only exemptions for modules that still export something', () => {
    const modules = getComponentModules()
    expect(Object.keys(EXEMPT_MODULES).filter((module) => !modules.includes(module))).toEqual([])
  })
})

/** Module directories behind the root barrel's components and the package's subpath exports, exempt ones included. */
function getComponentModules(): string[] {
  const barrel = readFileSync(join(SRC, 'index.ts'), 'utf-8')
  const fromBarrel = [...barrel.matchAll(/export \{([^}]*)\} from '\.\/([^']+)'/g)]
    .filter(([, names = '']) => names.split(',').some((name) => /^[A-Z][a-z]/.test(getExportedName(name))))
    .map(([, , source = '']) => getModuleDir(source))

  const { exports } = JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf-8')) as {
    exports: Record<string, unknown>
  }
  const fromExports = Object.values(exports)
    .filter((target): target is string => typeof target === 'string')
    .map((target) => /^\.\/src\/(.+)\/index\.ts$/.exec(target)?.[1])
    .filter((module): module is string => module !== undefined)

  return [...new Set([...fromBarrel, ...fromExports])].sort()
}

/** The flat-file primitives in src/components and src/shadcn. */
function getPrimitiveFiles(): string[] {
  return ['components', 'shadcn'].flatMap((dir) =>
    readdirSync(join(SRC, dir))
      .filter((file) => file.endsWith('.tsx') && !/\.(test|stories)\.tsx$/.test(file))
      .map((file) => `${dir}/${file}`),
  )
}

/** The name a specifier exports, or '' for a type-only one. */
function getExportedName(specifier: string): string {
  const trimmed = specifier.trim()
  return trimmed.startsWith('type ') ? '' : (trimmed.split(/\s+as\s+/).pop() ?? '')
}

/** `components/UniversalList/UniversalList` and `components/UniversalList` both live in `components/UniversalList`. */
function getModuleDir(source: string): string {
  const parts = source.split('/')
  return parts[0] === 'components' ? parts.slice(0, 2).join('/') : (parts[0] ?? source)
}

function hasStories(dir: string): boolean {
  return readdirSync(dir, { recursive: true, encoding: 'utf-8' }).some((file) => file.endsWith('.stories.tsx'))
}
