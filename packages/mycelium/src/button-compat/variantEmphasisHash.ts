import type { ButtonEmphasis, ButtonVariant } from './compile'

/**
 * A [variant][emphasis] cell, decomposed by interaction scope.
 *
 * Web joins the scopes back into one class string with its own prefixes
 * (`hover:` / `active:` / `focus-visible:` for the frame,
 * `group-hover/sbtn:` for the text) — see {@link joinScopes}. Native cannot:
 * uniwind 1.7.0's CSS processor recognizes only `:active`, `:focus`,
 * `:disabled`, `:dir()`, themes and `data-*` attributes, and a class whose
 * rule matched none of those never lands in the class map at all — the
 * resolver's lookup miss is a bare `continue`, so `hover:` / `group-hover:` /
 * `focus-visible:` classes are dropped in SILENCE. The native leg therefore
 * tracks hover/press in React state and picks the scope it wants, emitting
 * that scope's classes unprefixed.
 *
 * Values are IDENTICAL to the pre-decomposition strings; `web-class-pin.test.tsx`
 * pins all 32 re-joined cells verbatim.
 */
export interface ScopedCell {
  /** At-rest, unprefixed on web. */
  rest: string
  /** Pointer hover. Legacy: `hoverStyle` / `$group-item-hover`. */
  hover: string
  /** Press. Legacy: `pressStyle` — the same colors as hover, at base scale. */
  press: string
  /** Keyboard focus ring. Legacy: `focusVisibleStyle`. Native emits nothing. */
  focus: string
}

export type ScopePrefixes = Pick<Record<keyof ScopedCell, string>, 'hover' | 'press' | 'focus'>

/** Frame scope prefixes as the web leg emits them. */
export const FRAME_SCOPE_PREFIXES: ScopePrefixes = {
  hover: 'hover:',
  press: 'active:',
  focus: 'focus-visible:',
}

/**
 * Text scope prefixes: the label reads the FRAME's hover state, so its hover
 * scope is a `group-hover` variant on the frame's `group/sbtn` container
 * (legacy `$group-item-hover`, the `group: 'item'` read-back). Legacy's text
 * table has no press or focus entry, so those scopes are empty in every cell
 * and no prefix is ever applied — kept in the type for one uniform cell shape.
 */
export const TEXT_SCOPE_PREFIXES: ScopePrefixes = {
  hover: 'group-hover/sbtn:',
  press: '',
  focus: '',
}

function prefixScope(classes: string, prefix: string): string {
  if (classes === '') {
    return ''
  }
  return classes
    .split(' ')
    .map((cls) => `${prefix}${cls}`)
    .join(' ')
}

/**
 * The 32 joined cells as LITERAL strings — the ONLY place in the repo where the
 * prefixed compat classes (`hover:bg-neutral1-hovered`, `active:…`,
 * `focus-visible:…`, `group-hover/sbtn:…`) exist as source text.
 *
 * WHY THIS TABLE EXISTS. Tailwind v4 generates CSS from Oxide's *text* scan of
 * the registered `@source` roots — for mycelium, the consuming app points at
 * `packages/mycelium/src` (see apps/web/src/tailwind.css). Decomposing the
 * cells above into {@link ScopedCell} scopes deleted every compound token from
 * source text: `joinScopes` rebuilds them at RUNTIME, and a runtime
 * concatenation is invisible to a text scanner. Measured against the installed
 * @tailwindcss/oxide 4.3.2: the pre-decomposition literal yields
 * `hover:bg-neutral1-hovered` / `active:…` / `focus-visible:…` as candidates,
 * while the decomposed tables yield only the bare `bg-neutral1-hovered` /
 * `outline-neutral3-hovered`. With no candidate there is NO RULE, and the
 * classes then sit in the DOM doing nothing — silently, since nothing about the
 * rendered markup changes.
 *
 * These literals are what keep the 42 compound tokens scanner-visible. They are
 * NOT a second source of truth: `web-css-coverage.test.ts` set-compares them
 * against `joinScopes` over the tables above, so any divergence fails loudly,
 * and the same file re-compiles the real stylesheet and asserts every token
 * resolves to an actual CSS rule.
 *
 * Nothing imports these into the render path — `joinScopes` stays the single
 * runtime producer; `web-class-pin.test.tsx` checks it re-joins to these.
 */
export const FRAME_JOINED_CELLS: Record<ButtonVariant, Record<ButtonEmphasis, string>> = {
  default: {
    // Canonical neutral1, never the deprecated accent3 alias: value-identical on web
    // (--accent3: var(--neutral1)), and the only form with a token in the native bundle —
    // accent3 is web-only by design (packages/tailwind/native.css).
    primary:
      'bg-neutral1 hover:bg-neutral1-hovered active:bg-neutral1-hovered focus-visible:bg-neutral1-hovered focus-visible:outline-neutral3-hovered',
    secondary:
      'bg-surface3 hover:bg-surface3-hovered active:bg-surface3-hovered focus-visible:bg-surface3-hovered focus-visible:outline-neutral3-hovered',
    tertiary:
      'border-surface3 hover:border-surface3-hovered active:border-surface3-hovered focus-visible:bg-surface1 focus-visible:outline-neutral3-hovered',
    'text-only': 'focus-visible:outline-neutral3-hovered',
  },
  branded: {
    primary:
      'bg-accent1 hover:bg-accent1-hovered active:bg-accent1-hovered focus-visible:bg-accent1-hovered focus-visible:outline-accent1-hovered',
    secondary:
      'bg-accent2 hover:bg-accent2-hovered active:bg-accent2-hovered focus-visible:bg-accent2-hovered focus-visible:outline-accent1-hovered',
    tertiary:
      'border-accent2 hover:border-accent2-hovered active:border-accent2-hovered focus-visible:bg-surface1 focus-visible:outline-accent1-hovered',
    'text-only': 'focus-visible:bg-surface1 focus-visible:outline-accent1-hovered',
  },
  critical: {
    primary:
      'bg-critical hover:bg-critical-hovered active:bg-critical-hovered focus-visible:bg-critical-hovered focus-visible:outline-critical-hovered',
    secondary:
      'bg-critical-secondary hover:bg-critical-secondary-hovered active:bg-critical-secondary-hovered focus-visible:bg-critical-secondary-hovered focus-visible:outline-critical-hovered',
    tertiary:
      'border-critical-secondary hover:border-critical-secondary-hovered active:border-critical-secondary-hovered focus-visible:bg-surface1 focus-visible:outline-critical-hovered',
    'text-only': 'focus-visible:outline-critical-hovered',
  },
  warning: {
    primary:
      'bg-warning hover:bg-warning-hovered active:bg-warning-hovered focus-visible:bg-warning-hovered focus-visible:outline-warning-hovered',
    secondary:
      'bg-warning-secondary hover:bg-warning-secondary-hovered active:bg-warning-secondary-hovered focus-visible:bg-warning-secondary-hovered focus-visible:outline-warning-hovered',
    tertiary:
      'border-warning-secondary hover:border-warning-secondary-hovered active:border-warning-secondary-hovered focus-visible:bg-surface1 focus-visible:outline-warning-hovered',
    'text-only': 'focus-visible:outline-warning-hovered',
  },
}

/** Text-table half of {@link FRAME_JOINED_CELLS}: the `group-hover/sbtn:` tokens. */
export const TEXT_JOINED_CELLS: Record<ButtonVariant, Record<ButtonEmphasis, string>> = {
  default: {
    primary: 'text-surface1 group-hover/sbtn:text-surface1-hovered',
    secondary: 'text-neutral1 group-hover/sbtn:text-neutral1-hovered',
    tertiary: 'text-neutral1 group-hover/sbtn:text-neutral1-hovered',
    'text-only': 'text-neutral1 group-hover/sbtn:text-neutral1-hovered',
  },
  branded: {
    primary: 'text-white',
    secondary: 'text-accent1 group-hover/sbtn:text-accent1-hovered',
    tertiary: 'text-accent1 group-hover/sbtn:text-accent1-hovered',
    'text-only': 'text-accent1 group-hover/sbtn:text-accent1-hovered',
  },
  critical: {
    primary: 'text-white',
    secondary: 'text-critical group-hover/sbtn:text-critical-hovered',
    tertiary: 'text-critical group-hover/sbtn:text-critical-hovered',
    'text-only': 'text-critical group-hover/sbtn:text-critical-hovered',
  },
  warning: {
    primary: 'text-surface1 group-hover/sbtn:text-surface1-hovered',
    secondary: 'text-warning group-hover/sbtn:text-warning-hovered',
    tertiary: 'text-warning group-hover/sbtn:text-warning-hovered',
    'text-only': 'text-warning group-hover/sbtn:text-warning-hovered',
  },
}

/**
 * Re-joins a decomposed cell into the single web class string. Scope order —
 * rest, hover, press, focus — is load-bearing: it reproduces the pre-INFRA-3230
 * literals byte-for-byte, which is what keeps the workbench parity proof valid.
 */
export function joinScopes(cell: ScopedCell, prefixes: ScopePrefixes): string {
  return [
    cell.rest,
    prefixScope(cell.hover, prefixes.hover),
    prefixScope(cell.press, prefixes.press),
    prefixScope(cell.focus, prefixes.focus),
  ]
    .filter(Boolean)
    .join(' ')
}

// Transcribed from CustomButtonFrame/variantEmphasisHash.ts. press == hover color + base scale.
export const FRAME_VARIANT_EMPHASIS: Record<ButtonVariant, Record<ButtonEmphasis, ScopedCell>> = {
  default: {
    // Canonical neutral1, never the deprecated accent3 alias: value-identical on web
    // (--accent3: var(--neutral1)), and the only form with a token in the native bundle —
    // accent3 is web-only by design (packages/tailwind/native.css).
    primary: {
      rest: 'bg-neutral1',
      hover: 'bg-neutral1-hovered',
      press: 'bg-neutral1-hovered',
      focus: 'bg-neutral1-hovered outline-neutral3-hovered',
    },
    secondary: {
      rest: 'bg-surface3',
      hover: 'bg-surface3-hovered',
      press: 'bg-surface3-hovered',
      focus: 'bg-surface3-hovered outline-neutral3-hovered',
    },
    tertiary: {
      rest: 'border-surface3',
      hover: 'border-surface3-hovered',
      press: 'border-surface3-hovered',
      focus: 'bg-surface1 outline-neutral3-hovered',
    },
    'text-only': { rest: '', hover: '', press: '', focus: 'outline-neutral3-hovered' },
  },
  branded: {
    primary: {
      rest: 'bg-accent1',
      hover: 'bg-accent1-hovered',
      press: 'bg-accent1-hovered',
      focus: 'bg-accent1-hovered outline-accent1-hovered',
    },
    secondary: {
      rest: 'bg-accent2',
      hover: 'bg-accent2-hovered',
      press: 'bg-accent2-hovered',
      focus: 'bg-accent2-hovered outline-accent1-hovered',
    },
    tertiary: {
      rest: 'border-accent2',
      hover: 'border-accent2-hovered',
      press: 'border-accent2-hovered',
      focus: 'bg-surface1 outline-accent1-hovered',
    },
    'text-only': { rest: '', hover: '', press: '', focus: 'bg-surface1 outline-accent1-hovered' },
  },
  critical: {
    primary: {
      rest: 'bg-critical',
      hover: 'bg-critical-hovered',
      press: 'bg-critical-hovered',
      focus: 'bg-critical-hovered outline-critical-hovered',
    },
    secondary: {
      rest: 'bg-critical-secondary',
      hover: 'bg-critical-secondary-hovered',
      press: 'bg-critical-secondary-hovered',
      focus: 'bg-critical-secondary-hovered outline-critical-hovered',
    },
    tertiary: {
      rest: 'border-critical-secondary',
      hover: 'border-critical-secondary-hovered',
      press: 'border-critical-secondary-hovered',
      focus: 'bg-surface1 outline-critical-hovered',
    },
    'text-only': { rest: '', hover: '', press: '', focus: 'outline-critical-hovered' },
  },
  warning: {
    primary: {
      rest: 'bg-warning',
      hover: 'bg-warning-hovered',
      press: 'bg-warning-hovered',
      focus: 'bg-warning-hovered outline-warning-hovered',
    },
    secondary: {
      rest: 'bg-warning-secondary',
      hover: 'bg-warning-secondary-hovered',
      press: 'bg-warning-secondary-hovered',
      focus: 'bg-warning-secondary-hovered outline-warning-hovered',
    },
    tertiary: {
      rest: 'border-warning-secondary',
      hover: 'border-warning-secondary-hovered',
      press: 'border-warning-secondary-hovered',
      focus: 'bg-surface1 outline-warning-hovered',
    },
    'text-only': { rest: '', hover: '', press: '', focus: 'outline-warning-hovered' },
  },
}

/**
 * Transcribed from CustomButtonText/variantEmphasisHash.ts
 * ($group-item-hover -> the hover scope). No press or focus entries exist in
 * legacy, so a pressed label keeps its at-rest color on both platforms.
 */
export const TEXT_VARIANT_EMPHASIS: Record<ButtonVariant, Record<ButtonEmphasis, ScopedCell>> = {
  default: {
    primary: { rest: 'text-surface1', hover: 'text-surface1-hovered', press: '', focus: '' },
    secondary: { rest: 'text-neutral1', hover: 'text-neutral1-hovered', press: '', focus: '' },
    tertiary: { rest: 'text-neutral1', hover: 'text-neutral1-hovered', press: '', focus: '' },
    'text-only': { rest: 'text-neutral1', hover: 'text-neutral1-hovered', press: '', focus: '' },
  },
  branded: {
    primary: { rest: 'text-white', hover: '', press: '', focus: '' },
    secondary: { rest: 'text-accent1', hover: 'text-accent1-hovered', press: '', focus: '' },
    tertiary: { rest: 'text-accent1', hover: 'text-accent1-hovered', press: '', focus: '' },
    'text-only': { rest: 'text-accent1', hover: 'text-accent1-hovered', press: '', focus: '' },
  },
  critical: {
    primary: { rest: 'text-white', hover: '', press: '', focus: '' },
    secondary: { rest: 'text-critical', hover: 'text-critical-hovered', press: '', focus: '' },
    tertiary: { rest: 'text-critical', hover: 'text-critical-hovered', press: '', focus: '' },
    'text-only': { rest: 'text-critical', hover: 'text-critical-hovered', press: '', focus: '' },
  },
  warning: {
    primary: { rest: 'text-surface1', hover: 'text-surface1-hovered', press: '', focus: '' },
    secondary: { rest: 'text-warning', hover: 'text-warning-hovered', press: '', focus: '' },
    tertiary: { rest: 'text-warning', hover: 'text-warning-hovered', press: '', focus: '' },
    'text-only': { rest: 'text-warning', hover: 'text-warning-hovered', press: '', focus: '' },
  },
}

/**
 * Mirrors the shared compat core's `enumClass` (../compat/style-classes.ts):
 * out-of-enum values — reachable at runtime via dynamically-typed prop spreads
 * even though the TS unions are exhaustive — degrade instead of crashing the
 * render. A [variant][emphasis] cell has no arbitrary-property equivalent, so
 * unknown keys fall back to the declared prop defaults: the 'default' variant
 * row, then that row's 'primary' cell. Params are widened to plain strings,
 * like enumClass's, so the fallbacks are reachable in the type system; the
 * empty terminal guards are unreachable for the transcribed tables above.
 */
export function variantEmphasisClass({
  map,
  variant,
  emphasis,
}: {
  map: Record<string, Record<string, ScopedCell>>
  variant: string
  emphasis: string
}): ScopedCell {
  const row: Record<string, ScopedCell> = map[variant] ?? map['default'] ?? {}
  return row[emphasis] ?? row['primary'] ?? EMPTY_CELL
}

const EMPTY_CELL: ScopedCell = { rest: '', hover: '', press: '', focus: '' }
