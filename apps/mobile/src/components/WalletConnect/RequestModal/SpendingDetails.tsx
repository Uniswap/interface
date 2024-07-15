import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { WalletChainId } from 'uniswap/src/types/chains'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useNativeCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

export function SpendingDetails({
  value,
  chainId,
}: {
  value: string
  chainId: WalletChainId
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const nativeCurrencyAmount = nativeCurrencyInfo
    ? getCurrencyAmount({
        value,
        valueType: ValueType.Raw,
        currency: nativeCurrencyInfo.currency,
      })
    : null
  const usdValue = useUSDValue(chainId, value)

  const tokenAmountWithSymbol =
    formatCurrencyAmount({ value: nativeCurrencyAmount, type: NumberType.TokenTx }) +
    ' ' +
    getSymbolDisplayText(nativeCurrencyInfo?.currency.symbol)
  const fiatAmount = convertFiatAmountFormatted(usdValue, NumberType.FiatTokenPrice)

  return (
    <ContentRow label={t('walletConnect.request.details.label.sending')} variant="body3">
      <Flex row alignItems="center" gap="$spacing4">
        <CurrencyLogo currencyInfo={nativeCurrencyInfo} size={iconSizes.icon16} />
        <Text variant="body3">{tokenAmountWithSymbol}</Text>
        <Text color="$neutral2" loading={!usdValue} variant="body3">
          ({fiatAmount})
        </Text>
      </Flex>
    </ContentRow>
  )
}
