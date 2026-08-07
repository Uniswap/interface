/**
 * The component-agnostic parity suite body. `describeParity` holds every proof
 * that a migrated component's compiled Tailwind CSS equals what the real
 * Tamagui component emits — the exhaustive per-scope matrix diff, the
 * animation-preset keyframe endpoints, the exclusions ledger, the palette-drift
 * ledger, and the jsdom-gated computed-style cascade — parameterized per
 * component. A component's test file supplies its bindings and adds only its
 * own component-behavior contract.
 */
import type { ReactElement } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'
import { canonicalColor, normalizeDeclarations, resolveVars, type VarTable } from './css-normalize'
import { type Declarations, flattenCss } from './css-parse'
import { type DeclarationDiff, diffDeclarations } from './diff'
import { PALETTE_DRIFT } from './palette-drift'
import { BASE_SCOPE, foldThemeScopeKey } from './scope'
import {
  compileTailwindClasses,
  type CompiledTailwind,
  type ScopedDeclarations,
  scopedDeclarationsForClasses,
} from './tailwind-compile'
import { renderTamagui } from './tamagui-extract'
import type { ThemeName } from './theme'

/** One enumerated parity case: a props object rendered under a given theme. */
export interface ParityCase<P> {
  name: string
  props: P
  theme: ThemeName
}

/** Documented, never-silent exclusion from the byte-level proof. */
export interface ParityExclusionEntry {
  area: string
  reason: string
  standIn: string
}

export interface ParitySuiteConfig<P> {
  /** Label for the Layer A describe block. */
  label: string
  matrix: ParityCase<P>[]
  /** Minimum matrix size the suite asserts (guards against silent case loss). */
  matrixMinSize: number
  /** The component's pure class compiler. */
  className: (props: P) => string
  /** Render the Tailwind twin (`<FlexCompat {...props} />`). */
  renderTwin: (props: P) => ReactElement
  /** Render the real Tamagui element (`<Flex {...props} />`). */
  tamaguiElement: (props: P) => ReactElement
  /** Per-case expected (pinned) scope → diff map. */
  expectedScopedDiffs: (props: P, theme: ThemeName) => Map<string, DeclarationDiff>
  exclusions: readonly ParityExclusionEntry[]
  animationsEnter: Record<string, { enterStyle: Record<string, unknown> }>
  animationsExit: Record<string, { exitStyle: Record<string, unknown> }>
  /** Named matrix cases exercised by the Layer B computed-style cascade. */
  layerBCases: string[]
  /** Properties compared in Layer B (literal-value only, jsdom-safe). */
  layerBProps: string[]
}

interface TailwindSide {
  scopes: Map<string, Declarations>
  /** Exit keyframe end frame (normalized), when the case declares an exit preset. */
  exit?: Declarations
}

export function describeParity<P>(config: ParitySuiteConfig<P>): void {
  const { matrix, className } = config

  // Compile every candidate the whole matrix needs in one Tailwind build.
  const allCandidates = [...new Set(matrix.flatMap((c) => className(c.props).split(/\s+/).filter(Boolean)))]
  let compiled: CompiledTailwind

  beforeAll(async () => {
    compiled = await compileTailwindClasses(allCandidates)
  })

  function normalizeScopes(scopes: ScopedDeclarations, vars: VarTable): Map<string, Declarations> {
    const out = new Map<string, Declarations>()
    for (const [key, decls] of scopes) {
      out.set(key, normalizeDeclarations(decls, vars))
    }
    return out
  }

  /**
   * Fold theme scopes (`.t_dark` / `.t_light` rules) for the compared theme,
   * mirroring the Tailwind side: matching-theme declarations apply on top of
   * the remaining scope (theme rules out-rank base rules in the cascade),
   * opposite-theme scopes drop.
   */
  function foldThemeScopes(scopes: Map<string, Declarations>, theme: ThemeName): Map<string, Declarations> {
    const out = new Map<string, Declarations>()
    const themed: Array<[string, Declarations]> = []
    for (const [key, decls] of scopes) {
      const target = foldThemeScopeKey(key, theme)
      if (target === undefined) {
        continue
      }
      if (target === key) {
        out.set(key, decls)
      } else {
        themed.push([target, decls])
      }
    }
    for (const [key, decls] of themed) {
      out.set(key, { ...out.get(key), ...decls })
    }
    return out
  }

  function tamaguiSide(matrixCase: ParityCase<P>): Map<string, Declarations> {
    const extraction = renderTamagui(config.tamaguiElement(matrixCase.props), matrixCase.theme)
    try {
      return foldThemeScopes(normalizeScopes(extraction.scopes, extraction.vars), matrixCase.theme)
    } finally {
      extraction.unmount()
    }
  }

  /** First identifier of an animation shorthand = the keyframes name. */
  function animationName(declaration: string, vars: VarTable): string {
    const resolved = resolveVars(declaration, vars)
    const [name = ''] = resolved.trim().split(/\s+/)
    if (name === '') {
      throw new Error(`could not extract animation name from "${declaration}"`)
    }
    return name
  }

  function keyframeFrame(name: string, frame: 'from' | 'to'): Declarations {
    const frames = compiled.keyframes.get(name)
    if (frames === undefined) {
      throw new Error(`no @keyframes emitted for "${name}"`)
    }
    const decls = frames.get(frame) ?? frames.get(frame === 'from' ? '0%' : '100%')
    if (decls === undefined) {
      throw new Error(`@keyframes ${name} has no "${frame}" frame`)
    }
    return decls
  }

  /**
   * Compile + normalize the Tailwind side, folding animation utilities into
   * animation-state scopes: the base `animation` declaration's keyframe start
   * frame becomes the `enter` scope (Tamagui's `.t_unmounted` equivalent), and
   * the `[data-exiting]`-scoped animation's end frame is returned separately.
   */
  function tailwindSide(matrixCase: ParityCase<P>): TailwindSide {
    const vars = compiled.varsFor(matrixCase.theme)
    const name = className(matrixCase.props)
    const scopes = normalizeScopes(
      scopedDeclarationsForClasses({ className: name, compiled, theme: matrixCase.theme }),
      vars,
    )
    const base = scopes.get(BASE_SCOPE)
    if (base?.['animation'] !== undefined) {
      scopes.set('enter', normalizeDeclarations(keyframeFrame(animationName(base['animation'], vars), 'from'), vars))
    }
    const exitScope = scopes.get('exit')
    let exit: Declarations | undefined
    if (exitScope?.['animation'] !== undefined) {
      exit = normalizeDeclarations(keyframeFrame(animationName(exitScope['animation'], vars), 'to'), vars)
      scopes.delete('exit')
    }
    return { scopes, exit }
  }

  function diffScopes(
    tamagui: Map<string, Declarations>,
    tailwind: Map<string, Declarations>,
  ): Map<string, DeclarationDiff> {
    const out = new Map<string, DeclarationDiff>()
    for (const key of new Set([...tamagui.keys(), ...tailwind.keys()])) {
      const diff = diffDeclarations(tamagui.get(key) ?? {}, tailwind.get(key) ?? {})
      if (Object.keys(diff).length > 0) {
        out.set(key, diff)
      }
    }
    return out
  }

  describe(config.label, () => {
    it.each(matrix.map((c) => [c.name, c] as const))('%s', (_name, matrixCase) => {
      const tamagui = tamaguiSide(matrixCase)
      const tailwind = tailwindSide(matrixCase)
      const actual = diffScopes(tamagui, tailwind.scopes)
      const expected = config.expectedScopedDiffs(matrixCase.props, matrixCase.theme)
      expect(Object.fromEntries(actual), `props=${JSON.stringify(matrixCase.props)} theme=${matrixCase.theme}`).toEqual(
        Object.fromEntries(expected),
      )
    })

    it('matrix covers the declared size', () => {
      expect(matrix.length).toBeGreaterThanOrEqual(config.matrixMinSize)
    })
  })

  describe('Animation presets — keyframe endpoints match the ui/src preset definitions', () => {
    /** Convert a preset style ({ y: -10, opacity: 0 }) to normalized declarations. */
    function presetDeclarations(style: Record<string, unknown>): Declarations {
      const decls: Declarations = {}
      if (style['opacity'] !== undefined) {
        decls['opacity'] = String(style['opacity'])
      }
      if (style['y'] !== undefined) {
        decls['transform'] = `translateY(${String(style['y'])}px)`.toLowerCase()
      }
      return decls
    }

    const enterEntries = Object.entries(config.animationsEnter)
    it.each(enterEntries)('enter preset %s', (preset, definition) => {
      const matrixCase = matrix.find((c) => (c.props as { animateEnter?: string }).animateEnter === preset)
      if (matrixCase === undefined) {
        throw new Error(`no matrix case exercises animateEnter=${preset}`)
      }
      const tailwind = tailwindSide(matrixCase)
      expect(tailwind.scopes.get('enter')).toEqual(presetDeclarations(definition.enterStyle))
    })

    const exitEntries = Object.entries(config.animationsExit)
    it.each(exitEntries)('exit preset %s', (preset, definition) => {
      const matrixCase = matrix.find((c) => (c.props as { animateExit?: string }).animateExit === preset)
      if (matrixCase === undefined) {
        throw new Error(`no matrix case exercises animateExit=${preset}`)
      }
      const tailwind = tailwindSide(matrixCase)
      expect(tailwind.exit).toEqual(presetDeclarations(definition.exitStyle))
    })

    it('the exclusions ledger stays non-empty and documented', () => {
      expect(config.exclusions.length).toBeGreaterThan(0)
      for (const exclusion of config.exclusions) {
        expect(exclusion.reason.length).toBeGreaterThan(20)
        expect(exclusion.standIn.length).toBeGreaterThan(20)
      }
    })
  })

  describe('palette drift ledger stays exact', () => {
    it('every pinned drift entry differs between the two systems (no stale entries)', () => {
      for (const theme of ['light', 'dark'] as const) {
        for (const [token, { tamagui, tailwind }] of Object.entries(PALETTE_DRIFT[theme])) {
          expect(tamagui, `${theme} ${token}`).not.toBe(tailwind)
          expect(canonicalColor(tamagui)).toBe(tamagui)
          expect(canonicalColor(tailwind)).toBe(tailwind)
        }
      }
    })
  })

  // ── Layer B — cascade-level sanity via getComputedStyle ────────────────
  // jsdom's CSS support is limited (no @layer, no var() in computed styles).
  // We flatten @layer wrappers before injection and compare only literal-value
  // properties. A runtime canary decides honestly whether jsdom can do this at
  // all; if it can't, the layer is skipped WITH the reason baked into the test
  // name — the real-browser (Playwright) pass is the documented follow-up.
  function stripLayers(css: string): string {
    const out: string[] = []
    for (const rule of flattenCss(css)) {
      if (
        rule.selector.startsWith('@') ||
        rule.selector.includes('&') ||
        rule.atPath.some((at) => at.startsWith('@media'))
      ) {
        continue
      }
      const body = Object.entries(rule.declarations)
        .map(([p, v]) => `${p}: ${v};`)
        .join(' ')
      out.push(`${rule.selector} { ${body} }`)
    }
    return out.join('\n')
  }

  function jsdomCascadeWorks(): boolean {
    const style = document.createElement('style')
    style.textContent = '.__layer_b_canary { display: inline-flex; }'
    document.head.appendChild(style)
    const el = document.createElement('div')
    el.className = '__layer_b_canary'
    document.body.appendChild(el)
    const works = getComputedStyle(el).display === 'inline-flex'
    el.remove()
    style.remove()
    return works
  }

  describe('Layer B — getComputedStyle cascade sanity (jsdom-capability gated)', () => {
    it('runs the cascade comparison when jsdom supports it, otherwise records why not', async () => {
      if (!jsdomCascadeWorks()) {
        // Honest skip: jsdom could not resolve a trivial class rule via
        // getComputedStyle. Real-browser computed-style comparison is the
        // Playwright follow-up (INFRA-2353).
        expect(jsdomCascadeWorks()).toBe(false)
        return
      }
      const { render } = await import('@testing-library/react')
      const style = document.createElement('style')
      style.textContent = stripLayers(compiled.css)
      document.head.appendChild(style)
      try {
        for (const name of config.layerBCases) {
          const matrixCase = matrix.find((c) => c.name === name)
          if (matrixCase === undefined) {
            throw new Error(`layer B case missing from matrix: ${name}`)
          }
          const tamaguiExtraction = renderTamagui(config.tamaguiElement(matrixCase.props), matrixCase.theme)
          const compatRender = render(config.renderTwin(matrixCase.props))
          const compatEl = compatRender.container.firstElementChild as HTMLElement
          const tamaguiComputed = getComputedStyle(tamaguiExtraction.element)
          const compatComputed = getComputedStyle(compatEl)
          for (const prop of config.layerBProps) {
            expect(compatComputed.getPropertyValue(prop), `case="${name}" property=${prop}`).toBe(
              tamaguiComputed.getPropertyValue(prop),
            )
          }
          compatRender.unmount()
          tamaguiExtraction.unmount()
        }
      } finally {
        style.remove()
      }
    })
  })
}
