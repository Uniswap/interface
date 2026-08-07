/**
 * The filter-select compat prop contracts (INFRA-3021 dropdown set): a
 * drop-in for the legacy web `DropdownSelector`
 * (`apps/web/src/components/Dropdowns/DropdownSelector.tsx`), whose surface
 * is `Omit<DropdownProps, 'children' | 'menuLabel'>` (the Dropdown +
 * SharedDropdownProps plumbing) plus the selector-specific options map. The
 * parity suite in `packages/tailwind/src/parity/filter-select` asserts key
 * coverage and live payload assignability against the real legacy type.
 */
import type * as React from 'react'
import type { MenuCompatIconComponent, MenuTelemetryAdapter } from '../menu-compat/types'
import type { FilterSelectDropdownStyles } from './compile'

/** Drop-in for the legacy `SelectOption` (label + GeneratedIcon | null). */
export interface FilterSelectOptionCompat {
  label: string
  icon?: MenuCompatIconComponent | null
}

export interface FilterSelectCompatProps {
  // ── DropdownSelector own props ──────────────────────────────────────────
  options: Record<string, FilterSelectOptionCompat>
  selectedValue: string
  onSelect: (value: string) => void
  ButtonIcon: MenuCompatIconComponent
  /** Test ID for the trigger button. */
  dataTestId?: string
  /** When set, each option gets data-testid={`${optionTestIdPrefix}${value}`}. */
  optionTestIdPrefix?: string

  // ── SharedDropdownProps (AdaptiveDropdown plumbing) ─────────────────────
  isOpen: boolean
  toggleOpen: (open: boolean) => void
  dropdownTestId?: string
  /** Accepted with the exact legacy type; the sheet leg is GATED (ledger). */
  adaptToSheet?: boolean
  /** GATED stand-in: title + aria-label until the tooltip compat lands (ledger). */
  tooltipText?: string
  /** The legacy FlexProps leak: spreads over the verbatim card defaults. */
  dropdownStyle?: FilterSelectDropdownStyles
  containerStyle?: React.CSSProperties
  /** Prefer end alignment (refined by collision avoidance, ledger). */
  alignRight?: boolean
  /** When false, collision avoidance is disabled (legacy allowFlip default: on). */
  allowFlip?: boolean
  /** Accepted-inert: every compat popup already portals + avoids clipping (ledger). */
  positionFixed?: boolean
  matchTriggerWidth?: boolean
  /** Prefer the top side (refined by collision avoidance, ledger). */
  forceFlipUp?: boolean
  /** Accepted-inert: dismissal is owned by Base UI Menu (ledger). */
  ignoredNodes?: React.RefObject<HTMLElement | undefined | null>[]
  /** Accepted-inert: dismissal is owned by Base UI Menu (ledger). */
  ignoreDialogClicks?: boolean

  // ── DropdownProps trigger plumbing ──────────────────────────────────────
  hideChevron?: boolean
  /** Legacy `'$icon.16' | '$icon.20'`, mapped to glyph pixels. */
  chevronSize?: '$icon.16' | '$icon.20'
  isTriggerStyled?: boolean
  /** The legacy FlexProps leak on the trigger; the compat honors the class-mappable subset. */
  buttonStyle?: FilterSelectDropdownStyles
  /** Accepted-inert: Tamagui transition tuning (compat chrome transitions live in CSS). */
  transition?: unknown

  // ── Compat-only supersets ───────────────────────────────────────────────
  /** Host-injected analytics seam (menu-compat MenuTelemetryAdapter pattern). */
  telemetryAdapter?: MenuTelemetryAdapter
}

/** One row of the multi-select checkbox shape (D′ — ProtocolFilterDropdown archetype). */
export interface FilterSelectMultiItemCompat {
  value: string
  label: string
  checked: boolean
  disabled?: boolean
  icon?: React.ReactNode
  testID?: string
}

export interface FilterSelectMultiCompatProps extends Pick<
  FilterSelectCompatProps,
  | 'isOpen'
  | 'toggleOpen'
  | 'dataTestId'
  | 'dropdownTestId'
  | 'dropdownStyle'
  | 'alignRight'
  | 'forceFlipUp'
  | 'matchTriggerWidth'
  | 'hideChevron'
  | 'telemetryAdapter'
> {
  /** Trigger label content. */
  label: React.ReactNode
  items: FilterSelectMultiItemCompat[]
  onToggle: (value: string, checked: boolean) => void
  /** Renders the Select all / Clear header when provided (sandbox spec). */
  onSelectAll?: () => void
  onClear?: () => void
  selectAllLabel?: string
  clearLabel?: string
  selectAllDisabled?: boolean
  showClear?: boolean
}
