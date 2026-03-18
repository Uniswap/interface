import { Key } from 'react'
import { ButtonProps, Flex, FlexProps } from 'ui/src'
import { get200MsAnimationDelayFromIndex } from 'ui/src/theme/animations/delay200ms'
import { AmountInputPresetsProps } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { isHoverable } from 'utilities/src/platform'

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
            transform: [{ translateY: -4 }],
            '$group-hover': { opacity: 1, transform: [{ translateY: 0 }] },
          }
        : {})}
      animation="100ms"
      {...rest}
    >
      {presets.map((preset, index) => (
        <Flex
          key={preset}
          grow
          {...(isHoverable
            ? {
                opacity: 0,
                transform: [{ translateY: -4 }, { scale: 0.95 }],
                '$group-hover': {
                  opacity: 1,
                  transform: [{ translateY: 0 }],
                  scale: 1,
                },
                animation: get200MsAnimationDelayFromIndex(hoverLtr ? index : presets.length - index - 1),
              }
            : {})}
        >
          {renderPreset(preset)}
        </Flex>
      ))}
    </Flex>
  )
}
