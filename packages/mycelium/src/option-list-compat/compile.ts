/**
 * The option-list class compilers + literal chrome constants (INFRA-3021
 * dropdown set). Two kinds of styling live here:
 * - pure prop → Tailwind class compilers whose input payloads are copied
 *   VERBATIM from the legacy sources (`NetworkOption.tsx`,
 *   `NetworkFilterContent.tsx`) and byte-diffed by the parity matrices in
 *   `packages/tailwind/src/parity/option-list`;
 * - FULL LITERAL class-string constants for the fixed chrome (search input,
 *   checkbox visuals, CTA row, keyboard-highlight state) — never assembled
 *   from template literals, so Tailwind's static scanner and the workbench
 *   manifest can extract them; the dropdown-set classes suite proves their
 *   CSS exists.
 */
import { flexCompatClassName } from '../flex-compat/compile'
import type { FlexCompatProps } from '../flex-compat/props'
import { textCompatClassName } from '../text-compat/compile'
import type { TextCompatProps } from '../text-compat/props'

// ── Option row (NetworkOption grammar) ───────────────────────────────────

/** The legacy NetworkOption root Flex props, verbatim (hoverStyle applied by the compiler). */
export const OPTION_ROW_FRAME_PROPS_COMPAT: FlexCompatProps = {
  row: true,
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '$spacing8',
  py: 10,
}

export interface OptionRowFrameStyleInputs {
  /** The legacy hover radius: NetworkOption defaults $rounded8; NetworkFilterV2 rows pass $rounded16. */
  borderRadius?: '$rounded8' | '$rounded16'
}

/**
 * Compile the row frame: the verbatim NetworkOption frame + the hover state
 * (background + radius live in hoverStyle exactly like the legacy source) +
 * the interaction-surface styles the legacy TouchableArea wrapper owned
 * (cursor/user-select — pinned one-sided in the parity expectations).
 */
export function optionRowFrameClassName({ borderRadius }: OptionRowFrameStyleInputs = {}): string {
  return flexCompatClassName({
    ...OPTION_ROW_FRAME_PROPS_COMPAT,
    cursor: 'pointer',
    userSelect: 'none',
    hoverStyle: { backgroundColor: '$surface2', borderRadius: borderRadius ?? '$rounded8' },
  })
}

/** The legacy NetworkOption label Text props, verbatim. */
export const OPTION_ROW_LABEL_PROPS_COMPAT: TextCompatProps = {
  color: '$neutral1',
  variant: 'body2',
}

export function optionRowLabelClassName(): string {
  return textCompatClassName(OPTION_ROW_LABEL_PROPS_COMPAT)
}

/** Keyboard-highlight state (compat-only a11y upgrade): the hover paint, applied while active. */
export const OPTION_ROW_ACTIVE_CLASS_NAME = 'rounded-[16px] bg-surface2'

/** Stacked subset logos (the NetworkPile variant): overlap after the first. */
export const OPTION_ROW_PILE_ITEM_CLASS_NAME = 'flex first:ml-0 -ml-[8px]'

// ── Tier section header (NetworkFilterContent SectionHeader grammar) ─────

/** The legacy SectionHeader Flex props, verbatim. */
export const OPTION_LIST_SECTION_HEADER_FRAME_PROPS_COMPAT: FlexCompatProps = {
  backgroundColor: '$surface1',
  pb: '$spacing4',
  pt: '$spacing8',
  px: '$spacing8',
}

/** The legacy $platform-web sticky payload, verbatim (zIndexes.sticky = 1020). */
export const OPTION_LIST_SECTION_HEADER_STICKY_PROPS_COMPAT: FlexCompatProps = {
  position: 'sticky',
  top: 0,
  zIndex: 1020,
}

export interface OptionListSectionHeaderStyleInputs {
  sticky?: boolean
}

export function optionListSectionHeaderClassName({ sticky }: OptionListSectionHeaderStyleInputs = {}): string {
  return flexCompatClassName({
    ...OPTION_LIST_SECTION_HEADER_FRAME_PROPS_COMPAT,
    ...(sticky === true ? OPTION_LIST_SECTION_HEADER_STICKY_PROPS_COMPAT : {}),
  })
}

/** The legacy SectionHeader title Text props, verbatim. */
export const OPTION_LIST_SECTION_HEADER_TITLE_PROPS_COMPAT: TextCompatProps = {
  color: '$neutral2',
  variant: 'body4',
}

export function optionListSectionHeaderTitleClassName(): string {
  return textCompatClassName(OPTION_LIST_SECTION_HEADER_TITLE_PROPS_COMPAT)
}

// ── Search input (NetworkSearchBar chrome — approximated, ledgered) ──────

/** Outer NetworkSearchBar padding (`px=$spacing4 pb=$spacing8`). */
export const OPTION_LIST_SEARCH_INPUT_FRAME_CLASS_NAME = 'flex flex-col px-[4px] pb-[8px]'

/**
 * The input row: the SearchTextInput box chrome (surface2 fill, 1px surface3
 * border, rounded16, 8/12 padding, body1 metrics, neutral2 placeholder) as
 * one element — see the "Search input chrome" ledger entry.
 */
export const OPTION_LIST_SEARCH_INPUT_CLASS_NAME =
  'w-full rounded-[16px] border border-surface3 bg-surface2 px-[12px] py-[8px] text-[16px] leading-[24px] text-neutral1 placeholder:text-neutral2 outline-none'

// ── List + empty state ───────────────────────────────────────────────────

/** The scrollable list (legacy scrollableList Flex: minHeight 0, y-scroll). */
export const OPTION_LIST_SCROLL_CLASS_NAME = 'flex min-h-0 flex-col overflow-x-hidden overflow-y-auto'

/**
 * The non-scrolling positioning shell around the scroll area — the anchor for
 * the bottom scroll fade (design-requested addition, 2026-07 design review).
 */
export const OPTION_LIST_SCROLL_SHELL_CLASS_NAME = 'relative flex min-h-0 flex-col'

/**
 * The 24px bottom scroll fade (design-requested addition, 2026-07 design
 * review): surface1 at the bottom fading to surface1 at 0% opacity at its
 * top, overlaid on the scrollable list and removed the moment the list is
 * scrolled to its end.
 */
export const OPTION_LIST_BOTTOM_FADE_CLASS_NAME =
  'pointer-events-none absolute inset-x-0 bottom-0 h-[24px] bg-linear-to-t from-surface1 to-surface1/0'

/** The NoResultsFound stand-in frame (legacy pb=$spacing18 wrapper, centered body copy). */
export const OPTION_LIST_EMPTY_STATE_CLASS_NAME =
  'flex flex-col items-center px-[8px] py-[12px] pb-[18px] text-center text-[16px] leading-[24px] text-neutral2'

// ── Multi-select checked marker ──────────────────────────────────────────

/**
 * The trailing checked marker box on multi-select rows (design-requested
 * normalization, 2026-07 design review): the 24px reserved trailing box +
 * the filled CheckmarkCircle glyph, exactly the treatment the network
 * selector's OptionRowCompat uses — replacing the earlier sandbox-spec
 * checkbox square so single- and multi-select share one checkmark grammar.
 */
export const OPTION_CHECKED_MARKER_CLASS_NAME = 'flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center'

// ── Select all / Clear CTA row (sandbox spec) ────────────────────────────

export const SELECT_ALL_CLEAR_HEADER_CLASS_NAMES = {
  frame: 'flex shrink-0 flex-row items-center justify-between px-[12px] pt-[12px] pb-[4px]',
  selectAll: 'cursor-pointer text-[12px] font-medium text-accent1 disabled:cursor-default disabled:opacity-30',
  clear: 'cursor-pointer text-[12px] font-medium text-neutral1',
} as const
