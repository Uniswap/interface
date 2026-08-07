/**
 * Web-only dropdown trigger button (INFRA-3021 dropdown set): the legacy
 * `TriggerButton` chrome + `Dropdown` label/rotating-chevron grammar + the
 * four `NETWORK_FILTER_BUTTON_STYLES` sizes as one compat component. Chrome
 * ships as literal class constants in `./compile` (CSS-existence-tested);
 * byte-parity against the legacy styled(Text) twins is ledgered (they live
 * inside the web-app import graph — see the filter-select exclusions
 * ledger).
 *
 * Forwards unknown props/ref to the root element so overlay engines
 * (Base UI Menu.Trigger / Popover.Trigger via `render`) can compose it.
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM boundary (no Tamagui Flex here)
import * as React from 'react'
import { cn } from '../cn'
import {
  TRIGGER_BUTTON_BASE_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_EXPANDED_CLASS_NAME,
  TRIGGER_BUTTON_SIZE_CLASS_NAMES,
  TRIGGER_BUTTON_VARIANT_CLASS_NAMES,
} from './compile'
import type { TriggerButtonCompatProps } from './types'

type RootDivProps = Omit<React.HTMLAttributes<HTMLDivElement>, keyof TriggerButtonCompatProps>

/** Chevron-down glyph (rotates 180° while expanded), currentColor-driven. */
function ChevronGlyph({ size, expanded }: { size: number; expanded: boolean }): React.JSX.Element {
  return (
    <svg
      data-slot="trigger-chevron"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn(TRIGGER_BUTTON_CHEVRON_CLASS_NAME, expanded && TRIGGER_BUTTON_CHEVRON_EXPANDED_CLASS_NAME)}
    >
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const TriggerButtonCompat = React.forwardRef<HTMLDivElement, TriggerButtonCompatProps & RootDivProps>(
  function TriggerButtonCompat(props, ref) {
    const {
      isExpanded,
      onPress,
      children,
      size = 'medium',
      outlined = true,
      active,
      hideChevron,
      chevronSize = 20,
      tooltipLabel,
      disabled,
      testID,
      className,
      onClick,
      ...rest
    } = props

    const isActive = active ?? (isExpanded && outlined)

    const handlePress = (event: React.MouseEvent<HTMLDivElement>): void => {
      onPress?.()
      onClick?.(event)
    }

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled === true ? undefined : 0}
        {...rest}
        data-slot="trigger-button-compat"
        data-testid={testID}
        aria-expanded={isExpanded}
        aria-disabled={disabled === true ? true : undefined}
        // GATED tooltip stand-in (ledgered): native browser tooltip until #36951 lands.
        title={tooltipLabel}
        aria-label={tooltipLabel}
        className={cn(
          TRIGGER_BUTTON_BASE_CLASS_NAME,
          outlined ? TRIGGER_BUTTON_VARIANT_CLASS_NAMES.outlined : TRIGGER_BUTTON_VARIANT_CLASS_NAMES.plain,
          TRIGGER_BUTTON_SIZE_CLASS_NAMES[size],
          isActive && TRIGGER_BUTTON_VARIANT_CLASS_NAMES.active,
          disabled === true && TRIGGER_BUTTON_VARIANT_CLASS_NAMES.disabled,
          className,
        )}
        onClick={disabled === true ? undefined : handlePress}
      >
        {children}
        {hideChevron !== true && <ChevronGlyph size={chevronSize} expanded={isExpanded} />}
      </div>
    )
  },
)
