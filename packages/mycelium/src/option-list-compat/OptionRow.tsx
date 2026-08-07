/**
 * Web-only selectable option row (INFRA-3021 dropdown set): the legacy
 * `NetworkOption` grammar (`uniswap/src/components/network/NetworkOption.tsx`)
 * as slots — leading logo (or stacked pile), label, badge, trailing
 * checkmark / custom element. The frame/label classes are compiled by
 * `./compile` and byte-diffed against the legacy Flex/Text payloads by the
 * option-list parity matrices; chain metadata and logo pixels stay
 * host-provided (see the exclusions ledger).
 *
 * Forwards unknown props/ref to the root element so list hosts can attach
 * listbox option semantics (role/id/aria-selected).
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM boundary (no Tamagui Flex here)
import * as React from 'react'
import { cn } from '../cn'
import {
  OPTION_ROW_ACTIVE_CLASS_NAME,
  OPTION_ROW_PILE_ITEM_CLASS_NAME,
  optionRowFrameClassName,
  optionRowLabelClassName,
} from './compile'
import { CheckmarkCircleGlyph } from './icons'
import type { OptionRowCompatProps } from './types'

type RootDivProps = Omit<React.HTMLAttributes<HTMLDivElement>, keyof OptionRowCompatProps>

export const OptionRowCompat = React.forwardRef<HTMLDivElement, OptionRowCompatProps & RootDivProps>(
  function OptionRowCompat(props, ref) {
    const {
      label,
      logo,
      logoPile,
      badge,
      isSelected,
      trailingElement,
      disabled,
      active,
      onPress,
      testID,
      className,
      onClick,
      ...rest
    } = props

    const handlePress = (event: React.MouseEvent<HTMLDivElement>): void => {
      event.stopPropagation()
      onPress()
      onClick?.(event)
    }

    const leadingLogo =
      logoPile !== undefined && logoPile.length > 0 ? (
        <div data-slot="option-row-pile" className="flex flex-row items-center">
          {logoPile.map((pileLogo, index) => (
            <div key={index} className={OPTION_ROW_PILE_ITEM_CLASS_NAME}>
              {pileLogo}
            </div>
          ))}
        </div>
      ) : (
        logo
      )

    return (
      <div
        ref={ref}
        {...rest}
        data-slot="option-row-compat"
        data-testid={testID}
        aria-disabled={disabled === true ? true : undefined}
        className={cn(
          optionRowFrameClassName({ borderRadius: '$rounded16' }),
          active === true && OPTION_ROW_ACTIVE_CLASS_NAME,
          className,
        )}
        onClick={disabled === true ? undefined : handlePress}
      >
        <div className="flex min-w-0 flex-row items-center gap-[12px]">
          {leadingLogo !== undefined && leadingLogo !== null && <div className="flex flex-shrink-0">{leadingLogo}</div>}
          <span data-slot="option-row-label" className={optionRowLabelClassName()}>
            {label}
          </span>
          {badge !== undefined &&
            badge !== null && (
              // Legacy ElementAfterText renders the NewTag with an 8px web gap.
              <div data-slot="option-row-badge" className="ml-[8px] flex flex-shrink-0">
                {badge}
              </div>
            )}
        </div>
        {/* The 24px trailing box is always reserved (legacy layout). */}
        <div
          data-slot="option-row-trailing"
          className="flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center"
        >
          {trailingElement ??
            (isSelected === true && (
              <CheckmarkCircleGlyph data-slot="option-row-check" size={20} className="text-neutral1" />
            ))}
        </div>
      </div>
    )
  },
)
