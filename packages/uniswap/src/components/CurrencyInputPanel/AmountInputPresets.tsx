import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Flex, FlexProps } from 'ui/src'
import { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { get200MsAnimationDelayFromIndex } from 'ui/src/theme/animations/delay200ms'
import { PresetAmountButton, PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/PresetAmountButton'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isHoverable } from 'utilities/src/platform'

const PRESET_PERCENTAGES: PresetPercentage[] = [25, 50, 75, 100]

interface AmountInputPresetsProps {
  hoverLtr?: boolean
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency>
  nativeTokenPercentageBuffer?: number
  transactionType?: TransactionType
  buttonProps?: ButtonProps
  onSetPresetValue: (amount: string, percentage: PresetPercentage) => void
}

export function AmountInputPresets({
  hoverLtr,
  currencyAmount,
  currencyBalance,
  nativeTokenPercentageBuffer,
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
            nativeTokenPercentageBuffer={nativeTokenPercentageBuffer}
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
