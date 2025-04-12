import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Flex, FlexProps } from 'ui/src'
import { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { get200MsAnimationDelayFromIndex } from 'ui/src/theme/animations/delay200ms'
import { PresetAmountButton, PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/PresetAmountButton'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isWeb } from 'utilities/src/platform'

const PRESET_PERCENTAGES: PresetPercentage[] = [25, 50, 75, 100]

interface AmountInputPresetsProps {
  animateOnHover?: 'ltr' | 'rtl'
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency>
  transactionType?: TransactionType
  buttonProps?: ButtonProps
  onSetPresetValue: (amount: string, isLessThanMax?: boolean) => void
}

export function AmountInputPresets({
  currencyAmount,
  currencyBalance,
  transactionType,
  animateOnHover,
  buttonProps,
  onSetPresetValue,
  ...rest
}: AmountInputPresetsProps & FlexProps): JSX.Element {
  const shouldAnimate = isWeb && Boolean(animateOnHover)
  return (
    <Flex row gap="$gap4" opacity={shouldAnimate ? 0 : 1} $group-hover={{ opacity: 1 }} {...rest}>
      {PRESET_PERCENTAGES.map((percent, index) => (
        <Flex
          key={percent}
          grow
          opacity={shouldAnimate ? 0 : 1}
          $group-hover={{
            opacity: 1,
          }}
          animation={
            animateOnHover
              ? get200MsAnimationDelayFromIndex(
                  animateOnHover === 'ltr' ? index : PRESET_PERCENTAGES.length - index - 1,
                )
              : undefined
          }
        >
          <PresetAmountButton
            percentage={percent}
            currencyAmount={currencyAmount}
            currencyBalance={currencyBalance}
            currencyField={CurrencyField.INPUT}
            transactionType={transactionType}
            buttonProps={{ ...buttonProps, variant: 'default' }}
            onSetPresetValue={onSetPresetValue}
          />
        </Flex>
      ))}
    </Flex>
  )
}
