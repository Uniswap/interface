import { isHoverable } from '@universe/environment'
import { Key } from 'react'
import { ButtonProps, Flex, FlexProps } from 'ui/src'
import { AmountInputPresetsProps } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import {
  getStaggeredGroupHoverStyle,
  HOVER_REVEAL_EXIT_TRANSITION,
  HOVER_REVEAL_TRANSFORM,
} from 'uniswap/src/components/CurrencyInputPanel/hoverStyles'

export const PRESET_BUTTON_PROPS: ButtonProps = { variant: 'default', py: '$spacing4' }

export function AmountInputPresets<T extends Key>({
  hoverLtr,
  presets,
  renderPreset,
  ...rest
}: AmountInputPresetsProps<T> & FlexProps): JSX.Element {
  return (
    <Flex
      row
      gap="$gap4"
      {...(isHoverable
        ? {
            opacity: 0,

            transition: HOVER_REVEAL_EXIT_TRANSITION,
            '$group-hover': {
              opacity: 1,

              transition: 'opacity 100ms ease-in-out, transform 100ms ease-in-out',
            },
          }
        : {})}
      {...rest}
    >
      {presets.map((preset, index) => {
        const staggerIndex = hoverLtr ? index : presets.length - index - 1
        return (
          <Flex
            key={preset}
            grow
            $group-hover={isHoverable ? getStaggeredGroupHoverStyle(staggerIndex) : undefined}
            opacity={isHoverable ? 0 : undefined}
            transform={isHoverable ? HOVER_REVEAL_TRANSFORM : undefined}
            transition={isHoverable ? HOVER_REVEAL_EXIT_TRANSITION : undefined}
          >
            {renderPreset(preset)}
          </Flex>
        )
      })}
    </Flex>
  )
}
