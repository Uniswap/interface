/**
 * Static class tables for the RefreshButton compat (INFRA-3489).
 *
 * Every class is a full literal in this file — Tailwind's static scanner
 * reads source text, so an assembled candidate silently never compiles
 * (INFRA-3021) — and the complete universe is pinned by the CSS-existence
 * gate in `packages/tailwind/src/parity/refresh-button/classes-existence.test.ts`.
 *
 * Ported from the deleted legacy ui `RefreshButtonIcon` (the hover-revealed
 * TouchableArea frame) and `RefreshIcon` (the one-turn spin rule).
 *
 * The hover reveal keys off an ANCESTOR group's hover, in BOTH anchor
 * systems: Tailwind's `group-hover:` variant (a mycelium `group` ancestor)
 * plus the `legacy-group-hover:` coexistence variant, which matches Tamagui's
 * JS-toggled `.t_group_hover` marker (declared in
 * `packages/tailwind/css/compat.css`). The double spelling exists because the
 * sole consumer's anchor — `AnimatedNumber`'s unnamed group in
 * `packages/uniswap` — is still a legacy Tamagui anchor; without the legacy
 * leg the converted button would stay at opacity 0 forever with every gate
 * green. Drop the `legacy-group-hover:` classes when that anchor converts.
 */
import { cn } from '../cn'

/**
 * The legacy TouchableArea frame: fills and centers within the end-element
 * slot, hidden at rest (opacity 0) until an ancestor group hover reveals it.
 * The legacy frame transitions every property over 0.1s ease-in-out; opacity
 * is the only property this frame actually changes between states, so the
 * compat scopes the transition to it (the repo-wide "no all-property
 * transitions" rule — color tokens must never transition on theme toggle).
 */
export const REFRESH_FRAME_BASE_CLASSES =
  'flex-1 items-center justify-center opacity-0 transition-opacity duration-100 ease-in-out'

/** The hover reveal, in both group-anchor systems (see module docs). */
export const REFRESH_FRAME_REVEAL_CLASSES = 'group-hover:opacity-100 legacy-group-hover:opacity-100'

/**
 * Legacy hides the disabled button entirely (`display: 'none'`): the
 * TouchableArea disabled pool's 0.6 opacity would otherwise reveal this
 * hover-only button.
 */
export const REFRESH_FRAME_HIDDEN_CLASS = 'hidden'

/** Legacy sets the cursor manually so the disabled pool never breaks hover state. */
export const REFRESH_FRAME_CURSOR_ACTIVE_CLASS = 'cursor-pointer'
export const REFRESH_FRAME_CURSOR_INERT_CLASS = 'cursor-auto'

/**
 * The icon wrapper: the legacy icon renders `color="$neutral3"`, hovering the
 * group swaps to the hovered token unless a refresh is in flight (the icon
 * fills with `currentColor`, so the wrapper's text color is the icon color).
 */
export const REFRESH_ICON_FRAME_BASE_CLASSES = 'flex text-neutral3'
export const REFRESH_ICON_HOVER_CLASSES = 'group-hover:text-neutral3-hovered legacy-group-hover:text-neutral3-hovered'

/**
 * One full 360° turn per press — the `--animate-spore-refresh-spin` utility
 * declared in `packages/tailwind/css/compat.css`, mirroring the legacy
 * injected `rotate360` rule (1s cubic-bezier(0.83, 0, 0.17, 1), single
 * iteration).
 */
export const REFRESH_SPIN_CLASS = 'animate-spore-refresh-spin'

export interface RefreshButtonFrameState {
  isLoading: boolean
  disabled?: boolean
}

/** Compose the TouchableArea frame className for the current state. */
export function refreshButtonFrameClassName({ isLoading, disabled }: RefreshButtonFrameState): string {
  const interactive = !isLoading && disabled !== true
  return cn(
    REFRESH_FRAME_BASE_CLASSES,
    REFRESH_FRAME_REVEAL_CLASSES,
    interactive ? REFRESH_FRAME_CURSOR_ACTIVE_CLASS : REFRESH_FRAME_CURSOR_INERT_CLASS,
    disabled === true && REFRESH_FRAME_HIDDEN_CLASS,
  )
}

/** Compose the icon wrapper className for the current state. */
export function refreshIconFrameClassName({
  isLoading,
  isAnimating,
}: {
  isLoading: boolean
  isAnimating: boolean
}): string {
  return cn(
    REFRESH_ICON_FRAME_BASE_CLASSES,
    // While loading, legacy pins the hover color back to the base token —
    // identical computed style to simply not hovering.
    !isLoading && REFRESH_ICON_HOVER_CLASSES,
    isAnimating && REFRESH_SPIN_CLASS,
  )
}

function splitAll(...tables: ReadonlyArray<string>): readonly string[] {
  return tables.flatMap((table) => table.split(' ').filter((cls) => cls !== ''))
}

/**
 * Every class this compat can render — the CSS-existence gate compiles each
 * one through the real Tailwind engine.
 */
export const REFRESH_BUTTON_COMPAT_CLASS_UNIVERSE: readonly string[] = splitAll(
  REFRESH_FRAME_BASE_CLASSES,
  REFRESH_FRAME_REVEAL_CLASSES,
  REFRESH_FRAME_HIDDEN_CLASS,
  REFRESH_FRAME_CURSOR_ACTIVE_CLASS,
  REFRESH_FRAME_CURSOR_INERT_CLASS,
  REFRESH_ICON_FRAME_BASE_CLASSES,
  REFRESH_ICON_HOVER_CLASSES,
  REFRESH_SPIN_CLASS,
)
