import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { ContentRow } from 'uniswap/src/components/transactions/requests/ContentRow'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'

export function SpendingEthDetails({ value, chainId }: { value: string; chainId: UniverseChainId }): JSX.Element {
  const variant = isMobileApp ? 'body3' : 'body4'

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

  const { value: usdValue } = useUSDValueOfGasFee(chainId, value)

  const tokenAmountWithSymbol =
    formatCurrencyAmount({ value: nativeCurrencyAmount, type: NumberType.TokenTx }) +
    ' ' +
    getSymbolDisplayText(nativeCurrencyInfo?.currency.symbol)
  const fiatAmount = convertFiatAmountFormatted(usdValue, NumberType.FiatTokenPrice)

  return (
    <ContentRow label={t('walletConnect.request.details.label.sending')} variant={variant}>
      <Flex row alignItems="center" gap="$spacing4">
        <CurrencyLogo currencyInfo={nativeCurrencyInfo} size={iconSizes.icon16} />
        <Text variant={variant}>{tokenAmountWithSymbol}</Text>
        <Text color="$neutral2" loading={!usdValue} variant={variant}>
          ({fiatAmount})
        </Text>
      </Flex>
    </ContentRow>
  )
}

export function SpendingDetails({
  currencyInfo,
  showLabel,
  tokenCount,
}: {
  currencyInfo: CurrencyInfo
  showLabel: boolean
  tokenCount: number
}): JSX.Element {
  const variant = isMobileApp ? 'body3' : 'body4'

  const { t } = useTranslation()
  const labelCopy =
    tokenCount > 1 ? t('walletConnect.request.details.label.tokens') : t('walletConnect.request.details.label.token')

  return (
    <ContentRow label={showLabel ? labelCopy : ''} variant={variant}>
      <Flex row alignItems="center" gap="$spacing4">
        <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon16} />
        <Text variant={variant}>{getSymbolDisplayText(currencyInfo.currency.symbol)}</Text>
      </Flex>
    </ContentRow>
  )
}
