/**
 * Web-only dropdown trigger button (INFRA-3021 dropdown set): the legacy
 * `TriggerButton` chrome + `Dropdown` label/rotating-chevron grammar + the
 * four `NETWORK_FILTER_BUTTON_STYLES` sizes as one compat component. Chrome
 * ships as literal class constants in `./compile` (CSS-existence-tested);
 * byte-parity against the legacy styled(Text) twins is ledgered (they live
 * inside the web-app import graph — see the filter-select exclusions
 * ledger).
 *
 * Renders a native `<button type="button">` and forwards unknown props/ref to it, so overlay engines
 * (Base UI Menu.Trigger / Popover.Trigger via `render`, with `nativeButton`) can compose it.
 */
import { useButton } from '@base-ui/react/internals/use-button'
import * as React from 'react'
import { useComposedRefs } from 'utilities/src/react/composeRefs'
import { cn } from '../cn'
import {
  TRIGGER_BUTTON_BASE_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_EXPANDED_CLASS_NAME,
  TRIGGER_BUTTON_SIZE_CLASS_NAMES,
  TRIGGER_BUTTON_VARIANT_CLASS_NAMES,
} from './compile'
import type { TriggerButtonCompatProps } from './types'

type RootButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof TriggerButtonCompatProps | 'type'>

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

export const TriggerButtonCompat = React.forwardRef<HTMLButtonElement, TriggerButtonCompatProps & RootButtonProps>(
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

    const handlePress = (event: React.MouseEvent<HTMLButtonElement>): void => {
      onPress?.()
      onClick?.(event)
    }

    // Base UI's button hook sets `type` and `disabled` and yields to a Base UI trigger that renders this element.
    const { getButtonProps, buttonRef } = useButton({ disabled: disabled === true })
    // Base UI types its ref for any HTMLElement; a callback accepting that also accepts the button.
    const composedRef = useComposedRefs<HTMLButtonElement>(ref, buttonRef as React.Ref<HTMLButtonElement>)
    const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = getButtonProps({ ...rest, onClick: handlePress })

    return (
      <button
        ref={composedRef}
        {...buttonProps}
        data-slot="trigger-button-compat"
        data-testid={testID}
        aria-expanded={isExpanded}
        // GATED tooltip stand-in (ledgered): native browser tooltip until #36951 lands. Only a title, so the
        // visible text names the button; the title names an icon-only trigger.
        title={tooltipLabel}
        className={cn(
          TRIGGER_BUTTON_BASE_CLASS_NAME,
          outlined ? TRIGGER_BUTTON_VARIANT_CLASS_NAMES.outlined : TRIGGER_BUTTON_VARIANT_CLASS_NAMES.plain,
          TRIGGER_BUTTON_SIZE_CLASS_NAMES[size],
          isActive && TRIGGER_BUTTON_VARIANT_CLASS_NAMES.active,
          disabled === true && TRIGGER_BUTTON_VARIANT_CLASS_NAMES.disabled,
          className,
        )}
      >
        {children}
        {hideChevron !== true && <ChevronGlyph size={chevronSize} expanded={isExpanded} />}
      </button>
    )
  },
)
