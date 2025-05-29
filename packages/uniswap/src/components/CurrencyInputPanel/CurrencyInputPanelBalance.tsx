import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Text } from 'ui/src'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

interface CurrencyInputBalanceProps {
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyInfo: Maybe<CurrencyInfo>
  showInsufficientBalanceWarning: boolean
  currencyField: CurrencyField
}
export function CurrencyInputPanelBalance({
  currencyBalance,
  currencyInfo,
  currencyField,
  showInsufficientBalanceWarning,
}: CurrencyInputBalanceProps): JSX.Element | null {
  const { formatCurrencyAmount } = useLocalizationContext()
  const account = useAccountMeta()
  const isOutput = currencyField === CurrencyField.OUTPUT

  // Hide balance if panel is output, and no balance
  const hideCurrencyBalance = (isOutput && currencyBalance?.equalTo(0)) || !account

  if (!currencyInfo || hideCurrencyBalance) {
    return null
  }
  return (
    <Text color={showInsufficientBalanceWarning ? '$statusCritical' : '$neutral2'} variant="body3">
      {formatCurrencyAmount({
        value: currencyBalance,
        type: NumberType.TokenNonTx,
      })}{' '}
      {getSymbolDisplayText(currencyInfo.currency.symbol)}
    </Text>
  )
}
