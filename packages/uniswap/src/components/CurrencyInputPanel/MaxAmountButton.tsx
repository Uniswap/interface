import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
// eslint-disable-next-line no-restricted-imports -- types are safe to import
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import { Text, TouchableArea } from 'ui/src'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/useMaxAmountSpend'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'

interface MaxAmountButtonProps {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSetMax: (amount: string) => void
  style?: StyleProp<ViewStyle>
  currencyField: CurrencyField
  transactionType?: TransactionType
}

export function MaxAmountButton({
  currencyAmount,
  currencyBalance,
  onSetMax,
  style,
  currencyField,
  transactionType,
}: MaxAmountButtonProps): JSX.Element {
  const { t } = useTranslation()

  const maxInputAmount = useMaxAmountSpend(currencyBalance, transactionType)

  // Disable max button if max already set or when balance is not sufficient
  const disableMaxButton =
    !maxInputAmount || !maxInputAmount.greaterThan(0) || currencyAmount?.toExact() === maxInputAmount.toExact()

  const onPress = (event: GestureResponderEvent): void => {
    event.stopPropagation()

    if (!disableMaxButton) {
      onSetMax(maxInputAmount.toExact())
    }
  }

  return (
    <Trace
      logPress
      eventOnTrigger={SwapEventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED}
      element={currencyField === CurrencyField.INPUT ? ElementName.SetMaxInput : ElementName.SetMaxOutput}
    >
      <TouchableArea
        hapticFeedback
        backgroundColor={disableMaxButton ? '$surface3' : '$DEP_accentSoft'}
        borderRadius="$rounded8"
        opacity={disableMaxButton ? 0.5 : 1}
        px="$spacing4"
        py="$spacing2"
        style={style}
        testID={currencyField === CurrencyField.INPUT ? TestID.SetMaxInput : TestID.SetMaxOutput}
        onPress={onPress}
      >
        <Text color={disableMaxButton ? '$neutral2' : '$accent1'} variant="buttonLabel3">
          {t('swap.button.max')}
        </Text>
      </TouchableArea>
    </Trace>
  )
}
