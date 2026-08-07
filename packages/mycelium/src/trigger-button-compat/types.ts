/**
 * The trigger-button compat prop contract (INFRA-3021 dropdown set): the
 * legacy dropdown trigger grammar (web `TriggerButton` + `Dropdown`
 * menuLabel/chevron + the `NETWORK_FILTER_BUTTON_STYLES` sizes) as one
 * component.
 */
import type * as React from 'react'
import type { TriggerButtonCompatSize } from './compile'

export interface TriggerButtonCompatProps {
  /** Rotates the chevron and reports aria-expanded. */
  isExpanded: boolean
  onPress?: () => void
  /** Label content (icon + text — the legacy menuLabel slot). */
  children?: React.ReactNode
  /** Legacy NETWORK_FILTER_BUTTON_STYLES sizes. Default: medium. */
  size?: TriggerButtonCompatSize
  /** Legacy TriggerButton `outlined` variant. Default: true. */
  outlined?: boolean
  /** Legacy `active` variant (Dropdown passes isOpen && isTriggerStyled). Default: isExpanded && outlined. */
  active?: boolean
  hideChevron?: boolean
  /** Chevron glyph size in px (legacy $icon.16 / $icon.20). Default: 20. */
  chevronSize?: 16 | 20
  /**
   * GATED stand-in for the legacy tooltip-wrapped trigger: rendered as
   * title + aria-label until the tooltip compat (#36951) lands (ledgered).
   */
  tooltipLabel?: string
  disabled?: boolean
  testID?: string
  className?: string
}
