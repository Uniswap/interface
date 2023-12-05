import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { ChainId } from 'wallet/src/constants/chains'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useNativeCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function SpendingDetails({
  value,
  chainId,
}: {
  value: string
  chainId: ChainId
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

  return (
    <Flex row alignItems="center" gap="$spacing16">
      <Text color="$neutral2" variant="body2">
        {t('Sending')}:
      </Text>
      <Flex row alignItems="center" gap="$spacing4">
        <CurrencyLogo currencyInfo={nativeCurrencyInfo} size={iconSizes.icon16} />
        <Text variant="subheading2">
          {formatCurrencyAmount({ value: nativeCurrencyAmount, type: NumberType.TokenTx })}{' '}
          {getSymbolDisplayText(nativeCurrencyInfo?.currency.symbol)}
        </Text>
        <Text color="$neutral2" loading={!usdValue} variant="subheading2">
          ({convertFiatAmountFormatted(usdValue, NumberType.FiatTokenPrice)})
        </Text>
      </Flex>
    </Flex>
  )
}
