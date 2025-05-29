import { Flex, FlexProps } from 'ui/src'
import { get200MsAnimationDelayFromIndex } from 'ui/src/theme/animations/delay200ms'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import { PRESET_PERCENTAGES } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/constants'
import { AmountInputPresetsProps } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isHoverable } from 'utilities/src/platform'

export function AmountInputPresets({
  hoverLtr,
  currencyAmount,
  currencyBalance,
  transactionType,
  buttonProps,
  onSetPresetValue,
  ...rest
}: AmountInputPresetsProps & FlexProps): JSX.Element {
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
      {PRESET_PERCENTAGES.map((percent, index) => (
        <Flex
          key={percent}
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
                animation: get200MsAnimationDelayFromIndex(hoverLtr ? index : PRESET_PERCENTAGES.length - index - 1),
              }
            : {})}
        >
          <PresetAmountButton
            percentage={percent}
            currencyAmount={currencyAmount}
            currencyBalance={currencyBalance}
            currencyField={CurrencyField.INPUT}
            transactionType={transactionType}
            elementName={ElementName.PresetPercentage}
            buttonProps={{ ...buttonProps, variant: 'default', py: '$spacing4' }}
            onSetPresetValue={onSetPresetValue}
          />
        </Flex>
      ))}
    </Flex>
  )
}
