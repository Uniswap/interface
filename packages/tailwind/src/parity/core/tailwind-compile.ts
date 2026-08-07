/**
 * Tailwind side of the parity harness: compiles candidate classes to CSS
 * declarations using the real Tailwind v4 Node API against the exact
 * stylesheet stack the web app uses (`@import "tailwindcss"; @import
 * "@universe/tailwind/tailwind";` — see apps/web/src/tailwind.css).
 *
 * Every emitted rule is attributed to its utility class and canonical scope
 * (base, `hover`, `media(max-width:450px)`, `group-hover/item`, `exit`, …),
 * so variant utilities diff against Tamagui's scoped rules one-to-one.
 * `@keyframes` bodies are parsed too — animation-preset comparisons read the
 * actual frame declarations.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'tailwindcss'
import type { VarTable } from './css-normalize'
import { type Declarations, type FlatRule, flattenCss } from './css-parse'
import { foldThemeScopeKey, parseTailwindNestedParts, scopeKey } from './scope'
import type { ThemeName } from './theme'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const requireFromHere = createRequire(import.meta.url)

/** Mirrors apps/web/src/tailwind.css. */
const ENTRY_CSS = '@import "tailwindcss";\n@import "@universe/tailwind/tailwind";\n'

/** Marker utilities that intentionally emit no CSS of their own. */
function isInertMarkerClass(cls: string): boolean {
  return cls === 'group' || cls.startsWith('group/')
}

async function loadStylesheet(id: string, base: string): Promise<{ content: string; base: string; path: string }> {
  let path: string
  if (id.startsWith('.')) {
    path = resolve(base, id)
  } else if (id === 'tailwindcss') {
    path = requireFromHere.resolve('tailwindcss/index.css')
  } else if (id === '@universe/tailwind/tailwind') {
    path = join(pkgRoot, 'tailwind.css')
  } else {
    path = requireFromHere.resolve(id)
  }
  return { content: readFileSync(path, 'utf8'), base: dirname(path), path }
}

/** Declarations per canonical scope key (see ./scope). */
export type ScopedDeclarations = Map<string, Declarations>

export interface CompiledTailwind {
  /** Utility class → scope → declarations, exactly as Tailwind emitted them (vars unresolved). */
  classScopes: Map<string, ScopedDeclarations>
  /** Keyframe name → frame selector (`from`/`to`/`0%`…) → declarations. */
  keyframes: Map<string, Map<string, Declarations>>
  /**
   * Variable table for resolution: `:root`/`:host` custom properties (theme +
   * variables.css passthrough), `@property` initial values as fallbacks, and —
   * for dark mode — the `.dark` overrides applied on top.
   */
  varsFor: (theme: ThemeName) => VarTable
  /** The full compiled stylesheet (used by the cascade-level layer B check). */
  css: string
}

/** Unescape CSS identifier escapes (`.bg-\[\#131313\]` → `bg-[#131313]`). */
function unescapeSelectorClass(selector: string): string | undefined {
  if (!selector.startsWith('.')) {
    return undefined
  }
  let out = ''
  for (let i = 1; i < selector.length; i++) {
    const ch = selector[i]
    if (ch === '\\') {
      i++
      out += i < selector.length ? selector[i] : ''
    } else {
      out += ch
    }
  }
  return out
}

function isPlainUtilitySelector(selector: string): boolean {
  // exactly one class, no combinators/pseudos — variant scoping arrives via nested parts
  return selector.startsWith('.') && !/[\s>+~:[]/.test(selector.slice(1).replace(/\\./g, 'x'))
}

interface CollectVarsOptions {
  rules: FlatRule[]
  table: VarTable
  selectorFilter: (selector: string) => boolean
}

function collectRootVars({ rules, table, selectorFilter }: CollectVarsOptions): void {
  for (const rule of rules) {
    if (rule.atPath.some((at) => at.startsWith('@media'))) {
      continue // theme selection is explicit, media-scoped alternates are ignored
    }
    if (rule.selector.startsWith('@property ')) {
      const name = rule.selector.slice('@property '.length).trim()
      if (Object.hasOwn(rule.declarations, 'initial-value') && !table.has(name)) {
        table.set(name, rule.declarations['initial-value'])
      }
      continue
    }
    if (!rule.selector.split(',').some((s) => selectorFilter(s.trim()))) {
      continue
    }
    for (const [prop, value] of Object.entries(rule.declarations)) {
      if (prop.startsWith('--')) {
        table.set(prop, value)
      }
    }
  }
}

/** Split a flattened selector into the utility part and its nested `&…` parts. */
function splitNestedSelector(selector: string): { utility: string; nested: string[] } {
  const nestedStart = selector.search(/\s&/)
  if (nestedStart === -1) {
    return { utility: selector, nested: [] }
  }
  const utility = selector.slice(0, nestedStart)
  const nested = selector
    .slice(nestedStart)
    .split(/\s+(?=&)/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
  return { utility, nested }
}

function collectUtilityRule(classScopes: Map<string, ScopedDeclarations>, rule: FlatRule): void {
  if (rule.selector.startsWith('@')) {
    return
  }
  const { utility, nested } = splitNestedSelector(rule.selector)
  if (!isPlainUtilitySelector(utility)) {
    return
  }
  const className = unescapeSelectorClass(utility)
  if (className === undefined) {
    return
  }
  const nestedScope = parseTailwindNestedParts(nested)
  if (nestedScope === undefined) {
    return
  }
  const media = rule.atPath.filter((at) => at.startsWith('@media'))
  const key = scopeKey({ media, ...nestedScope })
  const scopes = classScopes.get(className) ?? new Map<string, Declarations>()
  const existing = scopes.get(key)
  if (existing === undefined) {
    scopes.set(key, rule.declarations)
  } else {
    // same utility+scope emitted twice (base + @supports refinement) — merge, later wins
    scopes.set(key, { ...existing, ...rule.declarations })
  }
  classScopes.set(className, scopes)
}

function collectKeyframes(keyframes: Map<string, Map<string, Declarations>>, rule: FlatRule): void {
  if (!rule.selector.startsWith('@keyframes ') || rule.rawBody === undefined) {
    return
  }
  const name = rule.selector.slice('@keyframes '.length).trim()
  const frames = new Map<string, Declarations>()
  for (const frame of flattenCss(rule.rawBody)) {
    frames.set(frame.selector, frame.declarations)
  }
  keyframes.set(name, frames)
}

/**
 * Compile all candidates once. The resulting stylesheet is parsed into a
 * class → scope → declarations map; anything the parser can't attribute to a
 * plain utility selector plus recognized scope parts is ignored for the map
 * (and the harness then fails loudly on any class with no declarations).
 */
export async function compileTailwindClasses(candidates: string[]): Promise<CompiledTailwind> {
  const compiler = await compile(ENTRY_CSS, { base: pkgRoot, loadStylesheet })
  const css = compiler.build([...new Set(candidates)])
  const rules = flattenCss(css)

  const classScopes = new Map<string, ScopedDeclarations>()
  const keyframes = new Map<string, Map<string, Declarations>>()
  for (const rule of rules) {
    collectUtilityRule(classScopes, rule)
    collectKeyframes(keyframes, rule)
  }

  // Source-of-truth variable tables. The compiled output already contains the
  // variables.css passthrough; parse the sources as well so tree-shaken-but-
  // referenced theme variables still resolve.
  const themeSource = flattenCss(readFileSync(join(pkgRoot, 'css', 'theme.css'), 'utf8'))
  const variablesSource = flattenCss(readFileSync(join(pkgRoot, 'css', 'variables.css'), 'utf8'))
  // The text-compat pinned variable layer (`--stext-*`: fonts + the generated
  // spore color mirror) ships as mycelium CSS the app imports alongside the
  // Tailwind stack; menu/text compat classes reference it. Relative
  // cross-package read for the same no-cycle reason the parity tests
  // relative-import mycelium sources.
  const stextSource = ['text-compat.css', 'spore-text-colors.generated.css'].flatMap((file) =>
    flattenCss(readFileSync(join(pkgRoot, '..', 'mycelium', 'src', 'text-compat', file), 'utf8')),
  )

  const varsFor = (theme: ThemeName): VarTable => {
    const table: VarTable = new Map()
    const isRootish = (sel: string): boolean => sel === ':root' || sel === ':host'
    // @theme blocks parse with selector '@theme' / '@theme inline'
    const isThemeBlock = (rule: FlatRule): boolean => rule.selector === '@theme' || rule.selector === '@theme inline'
    for (const rule of [...themeSource, ...variablesSource].filter(isThemeBlock)) {
      for (const [prop, value] of Object.entries(rule.declarations)) {
        if (prop.startsWith('--')) {
          table.set(prop, value)
        }
      }
    }
    collectRootVars({ rules, table, selectorFilter: isRootish })
    collectRootVars({ rules: variablesSource, table, selectorFilter: isRootish })
    collectRootVars({ rules: stextSource, table, selectorFilter: isRootish })
    if (theme === 'dark') {
      collectRootVars({ rules, table, selectorFilter: (sel) => sel === '.dark' })
      collectRootVars({ rules: variablesSource, table, selectorFilter: (sel) => sel === '.dark' })
      collectRootVars({ rules: stextSource, table, selectorFilter: (sel) => sel === '.dark' })
    }
    return table
  }

  return { classScopes, keyframes, varsFor, css }
}

interface ScopedClassDeclarationsOptions {
  className: string
  compiled: CompiledTailwind
  theme: ThemeName
}

/**
 * Expand a rendered className into per-scope merged declarations (later
 * classes win; tailwind-merge already removed intra-scope conflicts).
 *
 * Theme folding: `dark`-scoped declarations (`dark:` variants) merge into
 * their base scope when comparing the dark theme and drop entirely for
 * light — mirroring how the `.dark` ancestor class resolves at runtime.
 * `light`-scoped declarations (`$theme-light`) fold the same way for light.
 */
export function scopedDeclarationsForClasses({
  className,
  compiled,
  theme,
}: ScopedClassDeclarationsOptions): ScopedDeclarations {
  const folded: ScopedDeclarations = new Map()
  for (const cls of className.split(/\s+/).filter(Boolean)) {
    const scopes = compiled.classScopes.get(cls)
    if (scopes === undefined) {
      if (isInertMarkerClass(cls)) {
        continue
      }
      throw new Error(`tailwind compile: no CSS emitted for class "${cls}" — candidate missing or invalid`)
    }
    for (const [key, decls] of scopes) {
      const target = foldThemeScopeKey(key, theme)
      if (target === undefined) {
        continue
      }
      const existing = folded.get(target) ?? {}
      Object.assign(existing, decls)
      folded.set(target, existing)
    }
  }
  return folded
}
