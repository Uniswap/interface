/**
 * The compat compilers' diagnostics lane: the bounded report stream
 * (`logBoundedOnce`), the unknown-pool-key reporter (INFRA-3260) and the icon
 * lanes' shared `$`-colour resolution (`iconColorOrLog` — one acceptance set
 * and one reporter for both legs) and the layout lane's
 * `backgroundColor`/`borderColor` token reporter (`unmappedColorTokenClasses`). The dev-gate itself lives in `dev-build.ts`
 * (shared with `compose.ts`/`web-diagnostics.ts`) — imported here rather than
 * re-declared, so there is exactly one `isDevelopmentBuild()`.
 *
 * Everything on this lane reports through `@universe/logger` at ERROR level
 * rather than calling `console.warn` directly. Two reasons, both from review on
 * this file: the package is the house logging surface (mycelium already depends
 * on it and uses it in `UniversalList`, `AnchorCompat` and `TouchableTextLink`),
 * and warnings are lost in this app's console noise, while both diagnostics
 * carried here are real defects — a colour token that maps to no CSS, or a
 * compat key that compiles to nothing.
 *
 * The level is a REPORTING choice and nothing more. `logger.error` formats its
 * message, calls `console.error` and returns; it does not throw, rethrow or
 * abort the caller (`packages/logger/src/consoleLogger.ts`). That is load-
 * bearing here: this lane exists so an unresolvable colour costs one colour
 * instead of the whole render, and an escalating report would undo it.
 */
import { createConsoleLogger } from '@universe/logger'
import { isDevelopmentBuild } from './dev-build'
import { MAX_DEDUPED_DIAGNOSTICS } from './dev-semantics'
import type { CompatStyleProps } from './props'
import { hasOwnBorderWidth } from './style-props'
import { arbitrary, iconColorTokenValue, lookupToken, PALETTE_COLOR_LITERAL } from './tokens'

const logger = createConsoleLogger('mycelium')

interface ReportBudget {
  diagnosticClass: string
  reported: Set<string>
  suppressionAnnounced: boolean
}

/**
 * One budget PER DIAGNOSTIC CLASS, keyed on the dedupe key's prefix
 * (`unmapped-icon-color`, `unmapped-color`, an unknown-key `what`), not one
 * budget shared across
 * all of them: a burst of distinct unknown pool keys must not spend the cap the
 * unmapped-colour report needs, now that the report is the only signal left
 * where the colour lanes used to throw. The other bounded reporters
 * (`compose.ts`'s out-of-set classes, `preset-collision.ts`) hold their own
 * state and are untouched by this.
 */
let reportBudgets = new Map<string, ReportBudget>()

/**
 * Test hook: clear the per-diagnostic-class report budgets this module keeps
 * for `logBoundedOnce` (the dedupe keys and their suppression notices).
 *
 * Deliberately NOT `resetOutOfSetWarnings`: `compose.ts` exports a function by
 * that name backed by DIFFERENT state, and this one clears neither out-of-set
 * classes nor warnings. `compose.ts`'s version calls into this one, so a test
 * that needs everything cleared should still go through that entry point.
 */
export function resetBoundedReportBudgets(): void {
  reportBudgets = new Map()
}

/**
 * The budget a dedupe key spends from, derived from the key's text BEFORE the
 * first `:`.
 *
 * CONTRACT, load-bearing for the cap: a dedupe key must be
 * `<diagnosticClass>:<detail>`. A key with NO `:` becomes a diagnostic class of
 * its own, so its budget holds that one key and `MAX_DEDUPED_DIAGNOSTICS` can
 * never bound it — every such key reports, forever. That is intentional for the
 * `reportUnknownCompatKey` shape (`${what}:${key}`, always colonful) and for the
 * two colour lanes (`unmapped-icon-color:…`, `unmapped-color:<prop>:<token>`);
 * it is a trap for any FUTURE caller that passes a bare constant string, which
 * would then be its own unbounded class rather than joining a capped one. Every
 * caller in this file supplies a prefix; a new one must too.
 */
function reportBudgetFor(dedupeKey: string): ReportBudget {
  const separator = dedupeKey.indexOf(':')
  const diagnosticClass = separator === -1 ? dedupeKey : dedupeKey.slice(0, separator)
  const existing = reportBudgets.get(diagnosticClass)
  if (existing !== undefined) {
    return existing
  }
  const created: ReportBudget = { diagnosticClass, reported: new Set(), suppressionAnnounced: false }
  reportBudgets.set(diagnosticClass, created)
  return created
}

/**
 * Bounded, deduped error lane: once per dedupe key, capped per diagnostic
 * class, with one suppression notice at the cap. Which builds reach it is each
 * caller's choice, and they differ: `reportUnknownCompatKey` only gets here in
 * production because the dev build throws for unknown keys, while
 * `iconColorOrLog` and `unmappedColorTokenClasses` report on every build
 * because the colour lanes no longer throw anywhere.
 */
export function logBoundedOnce(dedupeKey: string, message: string): void {
  const budget = reportBudgetFor(dedupeKey)
  if (budget.reported.has(dedupeKey)) {
    return
  }
  if (budget.reported.size >= MAX_DEDUPED_DIAGNOSTICS) {
    if (!budget.suppressionAnnounced) {
      budget.suppressionAnnounced = true
      logger.error(
        `compat: ${MAX_DEDUPED_DIAGNOSTICS} distinct "${budget.diagnosticClass}" diagnostics reported — further reports suppressed.`,
      )
    }
    return
  }
  budget.reported.add(dedupeKey)
  logger.error(message)
}

/**
 * An unknown key (or preset name) in one of the pooled compat namespaces:
 * the pool tables cannot see it, so it compiles to nothing (INFRA-3260).
 * Development builds throw so the typo is fixed before it ships; production
 * builds report once per key (bounded) and keep the legacy drop — there is no
 * class to keep, and a render must never crash over a missing style (the
 * same gating as the out-of-set class reporter in `compose.ts`).
 */
export function reportUnknownCompatKey({ what, key, known }: { what: string; key: string; known: string[] }): void {
  const message =
    `compat: unknown ${what} "${key}" — it maps to no CSS and would be silently dropped. ` +
    `Known: ${known.join(', ')}.`
  if (isDevelopmentBuild()) {
    throw new Error(message)
  }
  logBoundedOnce(`${what}:${key}`, message)
}

/**
 * The icon lane's `$` colour resolution, with the throw replaced by a report.
 *
 * `iconColorTokenValue` already covers semantic tokens, the theme-invariant
 * literal trio, the themed interaction-state pairs AND the raw Spore palette
 * (that last one is what #39919 added), so `undefined` here means the token is
 * outside every map and there is no literal left to fall back to. Both icon
 * legs used to throw on it, in production as well as dev, which turned one
 * legacy wrapper injecting an unmapped `color` default into a blank page
 * rather than a wrong colour.
 *
 * `undefined` now means "emit no colour": the icon inherits `currentColor`,
 * which is exactly what the lane already does when no colour is passed at all
 * (`createIcon.tsx` defaults `color ?? defaultFill ?? 'currentColor'`, and the
 * native leg documents leaving the style channel alone).
 *
 * ONE reporter for both legs, keyed on the token, via `logBoundedOnce`:
 * bounded, deduped per JS runtime, logged at error level, and the two legs keep
 * identical acceptance sets because they both decide through this one function.
 */
export function iconColorOrLog(value: string): string | undefined {
  const resolved = iconColorTokenValue(value)
  if (resolved !== undefined) {
    return resolved
  }
  logBoundedOnce(
    `unmapped-icon-color:${value}`,
    `mycelium icons: color token "${value}" has no @universe/tailwind counterpart. ` +
      'Emitting no color, so the icon inherits currentColor. Use a semantic Spore token.',
  )
  return undefined
}

/**
 * The explicit drop signal, matched by REFERENCE in `borderColorDropClasses`, so
 * "this exact lane dropped an unmapped token" is checkable rather than inferred
 * from an empty array.
 *
 * Frozen, because it is one shared array reachable through public API and this
 * file's own `shadowClasses`/`transformClasses` use a build-then-push idiom that
 * would otherwise poison it. The cast is needed rather than a `readonly string[]`
 * export: the reference has to survive `colorClasses` unchanged for the identity
 * check to work, `colorClasses` returns the mutable `ClassList`, and widening
 * that type reaches well beyond this file.
 */
export const UNMAPPED_COLOR_DROP: string[] = Object.freeze([]) as unknown as string[]

/**
 * A `$` color token on the layout lane's `backgroundColor`/`borderColor` with
 * no `@universe/tailwind` counterpart.
 *
 * Warn-and-continue in EVERY build, including production. This lane used to
 * throw unconditionally, so a single converted file handing a raw Spore
 * palette token to a color prop shipped a render crash where the honest
 * failure is a visual difference — and a render must never crash over a
 * missing color (the same posture `dev-build.ts` and the native shadow lane
 * already state).
 *
 * A raw Spore palette token still has a theme-invariant literal to paint, so
 * it falls back to that: the same resolution `iconColorTokenValue` gained for
 * the icon lane, reusing that lane's `PALETTE_COLOR_LITERAL` table rather than
 * a second one. The literal rides an arbitrary class, which is outside the
 * generated safelist — that is fine on every lane that renders through
 * `composeCompatEmission`, which swaps it for the safelisted `--c-bg` var twin
 * and carries the literal inline. `avatar-compat` hand-builds its class list
 * instead, so an arbitrary colour does not paint there; that is pre-existing
 * (a raw `backgroundColor="#123456"` on an avatar fallback has never painted)
 * and not something this fallback changes.
 *
 * Anything else emits no colour and falls through, matching both the `bg` half
 * and what `flexColorClass` already does for Flex's own `color`: whatever else
 * supplies that colour (a ButtonCompat variant cell, say) survives the `cn()`
 * merge exactly as it would have if the prop were never set.
 *
 * The single exception lives in `borderColorDropClasses` below, which
 * `visualClasses` applies when the same style object sets a border width of its
 * own (`borderWidth` or any of the four per-side widths).
 *
 * `logBoundedOnce` keys on prop + token, so a given offender warns once per
 * runtime instead of once per render.
 */
export function unmappedColorTokenClasses(prefix: 'bg' | 'border', token: string): string[] {
  const prop = prefix === 'bg' ? 'backgroundColor' : 'borderColor'
  const literal = lookupToken(PALETTE_COLOR_LITERAL, token)
  logBoundedOnce(
    `unmapped-color:${prop}:${token}`,
    `compat: color token "${token}" for "${prop}" has no @universe/tailwind counterpart. ` +
      (literal === undefined
        ? `Emitting no ${prop} — the element renders without that color. Use a semantic Spore token.`
        : `Falling back to its raw Spore palette literal "${literal}". Use a semantic Spore token.`),
  )
  return literal === undefined ? UNMAPPED_COLOR_DROP : [`${prefix}-[${arbitrary(literal)}]`]
}

/** One entry of `ClassList`, restated here so this file need not import it. */
type DropEntry = string | false | undefined

/**
 * The one place the border lane does NOT simply fall through. `undefined` means
 * no `borderColor` prop was set, so there is nothing to say. The drop sentinel
 * means an unmapped `$` token was dropped: if the same style object also set a
 * border width of its own, nothing else is going to colour that border and
 * `RESET_CLASSES` sets none, so a bare drop would inherit `currentColor` and
 * paint a border in a colour nobody asked for. That case alone drops to the
 * safelisted `border-transparent`.
 *
 * Keyed on the style object's OWN width rather than applied unconditionally:
 * ButtonCompat takes its width from its base classes and its colour from a
 * variant cell, and an unconditional transparent border erased the variant's
 * border instead of falling through to it.
 */
export function borderColorDropClasses(
  classes: readonly DropEntry[] | undefined,
  props: CompatStyleProps,
): readonly DropEntry[] {
  // Reference identity, NOT emptiness: only the unmapped-token path above yields
  // UNMAPPED_COLOR_DROP. A swapped-in `options.colorClasses` strategy (the Text
  // lane) returns its own arrays, so it cannot gain a border colour it never
  // asked for.
  //
  // DELIBERATELY out of scope: `colorClasses`' own `resolveColorOrWarn` drop (a
  // legacy `OpaqueColorValue` — the admission of that type onto `ColorValue` is
  // what this package's comments label INFRA-3804) returns a different empty
  // array and so does NOT reach the transparent drop, even though that call site
  // did ask for a colour. An OpaqueColorValue on `borderColor` next to a width is
  // therefore still a `currentColor` border. That consequence is NOT tracked by
  // INFRA-3804 and has no ticket of its own: it is pre-existing, it is a lane
  // this change does not otherwise touch, and widening the guard to cover it is
  // a behaviour change of exactly the kind that already caused one regression
  // here, so it is a known, untracked gap rather than an oversight.
  //
  // Note for callers, about `colorClasses` and NOT about this function: it is
  // `colorClasses` that returns the frozen `UNMAPPED_COLOR_DROP` (via
  // `unmappedColorTokenClasses` above), so code that PUSHES onto a `colorClasses`
  // result rather than spreading it will now throw a TypeError where it
  // previously mutated a fresh array. All current callers spread. This function
  // never hands the sentinel back: the guard below returns early for every OTHER
  // array, and both returns past it build a fresh one.
  if (classes !== UNMAPPED_COLOR_DROP) {
    return classes ?? []
  }
  return hasOwnBorderWidth(props as Readonly<Record<string, unknown>>) ? ['border-transparent'] : []
}
