/**
 * The filter-select class compilers + literal chrome constants (INFRA-3021
 * dropdown set): the legacy web `AdaptiveDropdown` card and
 * `InternalMenuItem` row payloads, mirrored from
 * `apps/web/src/components/Dropdowns/{AdaptiveDropdown,Dropdown}.tsx`. The
 * card compiles through the Flex compat (the `dropdownStyle` FlexProps leak
 * spreads over the verbatim defaults, like the menu-compat containerStyles);
 * the fixed chrome ships as FULL LITERAL class strings, proven to exist by
 * the dropdown-set classes suite. Byte-parity against the styled(Text)
 * legacy twins is ledgered (see the filter-select exclusions ledger).
 */
import { lookupToken, SPACE_TOKEN_PX, type SporeSpaceToken } from '../compat/tokens'
import { flexCompatClassName } from '../flex-compat/compile'
import type { FlexCompatProps } from '../flex-compat/props'
import { textCompatClassName } from '../text-compat/compile'

/**
 * The legacy `dropdownStyle`/`buttonStyle` FlexProps leaks (children managed
 * by the compat), with `borderWidth` widened to the space tokens real call
 * sites pass (`'$spacing1'` in the DropdownSelector button defaults) —
 * normalized to pixels at compile time, same as menu-compat containerStyles.
 */
export type FilterSelectDropdownStyles = Omit<FlexCompatProps, 'children' | 'borderWidth'> & {
  borderWidth?: number | SporeSpaceToken
}

function normalizeStyles(styles: FilterSelectDropdownStyles): FlexCompatProps {
  const { borderWidth, ...rest } = styles
  if (typeof borderWidth !== 'string') {
    return borderWidth === undefined && !Object.hasOwn(styles, 'borderWidth')
      ? (rest as FlexCompatProps)
      : ({ ...rest, borderWidth } as FlexCompatProps)
  }
  const px = lookupToken(SPACE_TOKEN_PX, borderWidth)
  if (px === undefined) {
    throw new Error(`filter-select-compat: unknown space token for borderWidth "${borderWidth}"`)
  }
  return { ...rest, borderWidth: px } as FlexCompatProps
}

/** The legacy DropdownContent styled() defaults, verbatim (position/animation stay with the positioner). */
export const FILTER_SELECT_CARD_DEFAULTS_COMPAT: FilterSelectDropdownStyles = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 150,
  backgroundColor: '$surface1',
  borderWidth: 0.5,
  borderColor: '$surface3',
  borderRadius: '$rounded12',
  p: '$spacing8',
  overflow: 'auto',
}

/** Compile the dropdown card: legacy defaults + the dropdownStyle overrides (spread semantics). */
export function filterSelectCardClassName(dropdownStyle?: FilterSelectDropdownStyles): string {
  return flexCompatClassName(normalizeStyles({ ...FILTER_SELECT_CARD_DEFAULTS_COMPAT, ...dropdownStyle }))
}

/** Compile the trigger buttonStyle leak through the same normalization. */
export function filterSelectButtonStyleClassName(buttonStyle: FilterSelectDropdownStyles): string {
  return flexCompatClassName(normalizeStyles(buttonStyle))
}

/**
 * The legacy InternalMenuItem row chrome (styled(Text) payload as literals).
 * DELIBERATE DEVIATION (2026-07 design review): the hover/highlight paint is
 * $surface2, not the legacy $surface3 — normalized with the network selector
 * rows.
 */
export const FILTER_SELECT_ITEM_FRAME_CLASS_NAME =
  'flex flex-1 cursor-pointer flex-row items-center justify-between gap-[12px] rounded-[8px] px-[8px] py-[12px] text-neutral1 no-underline select-none hover:bg-surface2 data-highlighted:bg-surface2 aria-disabled:cursor-default aria-disabled:opacity-60'

/**
 * The option/trigger label. DELIBERATE DEVIATION (2026-07 design review):
 * normal weight (body3) instead of the legacy buttonLabel3 medium — medium
 * stays reserved for the multi-select Select all / Clear header.
 */
export function filterSelectItemLabelClassName(): string {
  return textCompatClassName({ variant: 'body3', color: '$neutral1' })
}

/**
 * The selected check slot. DELIBERATE DEVIATION (2026-07 design review): the
 * filled CheckmarkCircle glyph in $neutral1 — the network selector's marker —
 * instead of the legacy accent1 stroke check, so single-select, multi-select,
 * and the network selector share one checkmark grammar.
 */
export const FILTER_SELECT_CHECK_CLASS_NAME = 'flex shrink-0 text-neutral1'

/**
 * matchTriggerWidth via the Base UI positioner's anchor measurement — no JS
 * width syncing (the legacy AdaptiveDropdown measured the trigger itself).
 */
export const FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME = 'w-[var(--anchor-width)]'
