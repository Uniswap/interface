/**
 * The option-list compat prop contracts (INFRA-3021 dropdown set): the
 * shared row/section/search vocabulary the dropdown archetypes compose —
 * ported from the legacy NetworkFilterV2 dropdown content
 * (`NetworkFilterDropdownContent` / `NetworkFilterContent` /
 * `NetworkOption` / `NetworkSearchBar` in packages/uniswap). Chain metadata,
 * logos, and i18n strings stay host-injected (see the option-list parity
 * exclusions ledger).
 */
import type * as React from 'react'

/** One selectable row (the legacy NetworkOption grammar as slots). */
export interface OptionRowCompatProps {
  label: string
  /** Leading logo slot (legacy NetworkLogo stays host-provided). */
  logo?: React.ReactNode
  /** Stacked subset logos (the legacy NetworkPile "N networks" variant); wins over `logo`. */
  logoPile?: React.ReactNode[]
  /** Badge slot after the label (legacy NewTag / Beta pill stays host-provided). */
  badge?: React.ReactNode
  /** Trailing checkmark when true; the 24px trailing box is always reserved (legacy layout). */
  isSelected?: boolean
  /** Replaces the trailing checkmark slot entirely (legacy NetworkOption.trailingElement). */
  trailingElement?: React.ReactNode
  disabled?: boolean
  /** Keyboard-highlight state (aria-activedescendant target) — compat-only a11y upgrade. */
  active?: boolean
  onPress: () => void
  testID?: string
}

/** One item of a searchable option list (row props + search identity). */
export interface OptionListItemCompat {
  id: string
  label: string
  /** Additional search fields (the legacy interfaceName leg). */
  keywords?: string[]
  logo?: React.ReactNode
  logoPile?: React.ReactNode[]
  badge?: React.ReactNode
  isSelected?: boolean
  disabled?: boolean
  testID?: string
  onSelect: () => void
}

/** A titled tier section (legacy TieredNetworkOptions sticky-header grammar). */
export interface OptionListSectionCompat {
  key: string
  /** Sticky section header when set (legacy "With balances" / "Other networks"). */
  title?: string
  items: OptionListItemCompat[]
}

export interface SearchableOptionListCompatProps {
  sections: OptionListSectionCompat[]
  /** Host open state: the query clears when this goes false (legacy clear-on-close). */
  isOpen: boolean
  /** Default true; the sheet presentation suppresses it (legacy autoFocus-unless-sheet). */
  autoFocus?: boolean
  /** GATED sheet leg seam: suppresses autoFocus exactly like the legacy sheet branch. */
  isSheet?: boolean
  /** Host-injected i18n (ledgered). Default: "Search". */
  searchPlaceholder?: string
  /** Host-injected i18n (ledgered). Default: "No results found." */
  noResultsLabel?: string
  /** Extra classes for the scrollable list (e.g. the positioner-driven max-height clamp). */
  listClassName?: string
  /** Fill the host's flex column instead of self-sizing (legacy fillAvailableHeight). */
  fillAvailableHeight?: boolean
  /** Sticky tier headers (legacy web-desktop/extension presentation). Default true. */
  stickyHeaders?: boolean
  onQueryChange?: (query: string) => void
  listTestID?: string
}

/** The multi-select Select all / Clear CTA row (sandbox network-selector spec). */
export interface SelectAllClearHeaderCompatProps {
  onSelectAll: () => void
  onClear: () => void
  /** Host-injected i18n (ledgered). Default: "Select all". */
  selectAllLabel?: string
  /** Host-injected i18n (ledgered). Default: "Clear". */
  clearLabel?: string
  /** Dim + disable Select all (everything already selected). */
  selectAllDisabled?: boolean
  /** Hide the Clear affordance (nothing filtered yet). Default true. */
  showClear?: boolean
}

/** Multi-select checkbox row on Base UI Menu.CheckboxItem (menu hosts only). */
export interface CheckboxOptionItemCompatProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  icon?: React.ReactNode
  disabled?: boolean
  testID?: string
}
