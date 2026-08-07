/**
 * Component-agnostic Tamagui side of the parity harness: renders a real
 * `packages/ui` reference component under jsdom + react-native-web and extracts
 * the effective CSS declarations it contributes to its DOM element, organized
 * by canonical rule scope (base, pseudo states, media queries, group states,
 * enter states). The caller supplies which element to render (`renderTamagui`),
 * so any migrated component reuses the same extraction.
 *
 * Extraction reads the actual CSSOM rules Tamagui injects (both `<style>` text
 * and `insertRule`-inserted rules) — nothing is re-derived by hand.
 */
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createTamagui, TamaguiProvider } from 'ui/src'
// Deep import is deliberate (Danger warns, non-blocking): `configWithoutAnimations`
// has no `ui/src` barrel export.
import { configWithoutAnimations } from 'ui/src/theme/config'
import type { VarTable } from './css-normalize'
import { type Declarations, parseDeclarations } from './css-parse'
import { BASE_SCOPE, parseTamaguiSelector, scopeKey } from './scope'
import type { ThemeName } from './theme'

const config = createTamagui(configWithoutAnimations)

/** Declarations per canonical scope key (see ./scope). */
export type ScopedDeclarations = Map<string, Declarations>

export interface TamaguiExtraction {
  /** Raw declarations per scope from the element's atomic classes + inline style (vars unresolved). */
  scopes: ScopedDeclarations
  /** Variable table scoped to the requested theme (`:root` tokens + `:root.t_<theme>`). */
  vars: VarTable
  element: HTMLElement
  unmount: () => void
}

interface StyleRuleText {
  selector: string
  body: string
  /** Enclosing media-query texts, outermost first. */
  media: string[]
}

/** All style rules currently in the document, with their media-query scope. */
function collectStyleRules(): StyleRuleText[] {
  const out: StyleRuleText[] = []
  const walk = (rules: CSSRuleList, media: string[]): void => {
    for (const rule of Array.from(rules)) {
      const ctor = rule.constructor.name
      if (ctor === 'CSSMediaRule' || ctor === 'CSSSupportsRule') {
        const grouping = rule as CSSMediaRule
        const prelude = grouping.cssText.slice(0, grouping.cssText.indexOf('{')).trim()
        walk(grouping.cssRules, [...media, prelude])
      } else if (rule instanceof CSSStyleRule || ctor === 'CSSStyleRule') {
        const styleRule = rule as CSSStyleRule
        const css = styleRule.cssText
        const braceIdx = css.indexOf('{')
        out.push({
          selector: styleRule.selectorText,
          body: css.slice(braceIdx + 1, css.lastIndexOf('}')),
          media,
        })
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, [])
  }
  return out
}

/**
 * Build the CSS variable table for a theme: every custom property declared on
 * `:root` plus the `:root.t_<theme>` theme block (later rules win, as in the
 * cascade — equal specificity, source order). Media-scoped alternates are
 * ignored: the harness selects the theme explicitly.
 */
function buildVarTable(rules: StyleRuleText[], theme: ThemeName): VarTable {
  const table: VarTable = new Map()
  const themeSelector = `:root.t_${theme}`
  for (const { selector, body, media } of rules) {
    if (media.length > 0) {
      continue
    }
    const selectors = selector.split(',').map((s) => s.trim())
    const isRootTokens = selectors.includes(':root')
    const isThemeBlock = selectors.includes(themeSelector)
    if (!isRootTokens && !isThemeBlock) {
      continue
    }
    for (const [prop, value] of Object.entries(parseDeclarations(body))) {
      if (prop.startsWith('--')) {
        table.set(prop, value)
      }
    }
  }
  return table
}

/**
 * Declarations contributed by the element's classes, per canonical scope.
 * Same-scope conflicts resolve by Tamagui's own precedence mechanism — the
 * `:root` specificity chain (e.g. `$platform-web` overrides carry an extra
 * `:root`); a conflict at equal specificity would violate the atomic-class
 * assumption and throws.
 */
interface SpecifiedValue {
  value: string
  specificity: number
}

interface AssignBySpecificityOptions {
  values: Map<string, SpecifiedValue>
  scope: string
  prop: string
  value: string
  specificity: number
}

/** Cascade-style assignment: higher `:root` specificity wins; equal-specificity conflicts throw. */
function assignBySpecificity({ values, scope, prop, value, specificity }: AssignBySpecificityOptions): void {
  const existing = values.get(prop)
  if (existing !== undefined && existing.value !== value) {
    if (existing.specificity === specificity) {
      throw new Error(
        `tamagui extraction: conflicting declarations for "${prop}" in scope "${scope}" at equal specificity (${existing.value} vs ${value}) — atomic-class assumption violated`,
      )
    }
    if (existing.specificity > specificity) {
      return
    }
  }
  values.set(prop, { value, specificity })
}

function scopedDeclarationsForElement(element: HTMLElement, rules: StyleRuleText[]): ScopedDeclarations {
  const classSet = new Set(Array.from(element.classList))
  const valuesByScope = new Map<string, Map<string, SpecifiedValue>>()
  for (const { selector, body, media } of rules) {
    for (const single of selector.split(',').map((s) => s.trim())) {
      const parsed = parseTamaguiSelector(single)
      if (parsed === undefined || !classSet.has(parsed.className)) {
        continue
      }
      const key = scopeKey({ media, ...parsed.scope })
      const values = valuesByScope.get(key) ?? new Map<string, SpecifiedValue>()
      for (const [prop, value] of Object.entries(parseDeclarations(body))) {
        assignBySpecificity({ values, scope: key, prop, value, specificity: parsed.specificity })
      }
      valuesByScope.set(key, values)
    }
  }
  const scopes: ScopedDeclarations = new Map()
  for (const [key, values] of valuesByScope) {
    const decls: Declarations = {}
    for (const [prop, { value }] of values) {
      decls[prop] = value
    }
    scopes.set(key, decls)
  }
  // Inline styles win over class rules, in the base scope.
  const inline = element.getAttribute('style')
  if (inline !== null && inline !== '') {
    const base = scopes.get(BASE_SCOPE) ?? {}
    Object.assign(base, parseDeclarations(inline))
    scopes.set(BASE_SCOPE, base)
  }
  return scopes
}

/**
 * Custom properties Tamagui declares on element-scoped classes (e.g. the font
 * context: `.font_button { --f-family: …; --f-size-…: … }`) rather than
 * `:root`. Harvested for the element's own classList so declarations like
 * `font-family: var(--f-family)` resolve; element-scoped vars out-rank the
 * root table (higher specificity on the element).
 */
function elementScopedVars(element: HTMLElement, rules: StyleRuleText[]): VarTable {
  const table: VarTable = new Map()
  const classSelectors = new Set(Array.from(element.classList).map((cls) => `.${cls}`))
  for (const { selector, body, media } of rules) {
    if (media.length > 0) {
      continue
    }
    // Match on the selector's subject (last compound), so `:root .font_button`
    // and `:root .t_lang-button-default .font_button` both apply.
    const matches = selector.split(',').some((s) => {
      const subject = s.trim().split(/\s+/).at(-1)
      return subject !== undefined && classSelectors.has(subject)
    })
    if (!matches) {
      continue
    }
    for (const [prop, value] of Object.entries(parseDeclarations(body))) {
      if (prop.startsWith('--')) {
        table.set(prop, value)
      }
    }
  }
  return table
}

/** Render a real Tamagui component element and extract what it styles onto its element. */
export function renderTamagui(node: ReactElement, theme: ThemeName): TamaguiExtraction {
  const result = render(
    <TamaguiProvider config={config} defaultTheme={theme}>
      {node}
    </TamaguiProvider>,
  )
  // Provider renders a display:contents span wrapper; the component div is its first element child.
  const wrapper = result.container.firstElementChild
  const element = wrapper?.firstElementChild
  if (!(element instanceof HTMLElement)) {
    throw new Error('tamagui extraction: could not locate rendered element')
  }
  const rules = collectStyleRules()
  const vars = buildVarTable(rules, theme)
  for (const [prop, value] of elementScopedVars(element, rules)) {
    vars.set(prop, value)
  }
  return {
    scopes: scopedDeclarationsForElement(element, rules),
    vars,
    element,
    unmount: result.unmount,
  }
}
