import React from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useUSDValue } from 'src/features/gas/hooks'
import { useNativeCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import { iconSizes } from 'src/styles/sizing'
import { formatCurrencyAmount, formatUSDPrice, NumberType } from 'src/utils/format'
import { tryParseRawAmount } from 'src/utils/tryParseAmount'

export function SpendingDetails({
  value,
  chainId,
}: {
  value: string
  chainId: ChainId
}): JSX.Element {
  const { t } = useTranslation()

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const nativeCurrencyAmount = nativeCurrencyInfo
    ? tryParseRawAmount(value, nativeCurrencyInfo.currency)
    : null
  const usdValue = useUSDValue(chainId, value)

  return (
    <Flex row alignItems="center" gap="spacing16">
      <Text color="textSecondary" variant="bodySmall">
        {t('Sending')}:
      </Text>
      <Flex row alignItems="center" gap="spacing4">
        <CurrencyLogo currencyInfo={nativeCurrencyInfo} size={iconSizes.icon16} />
        <Text variant="subheadSmall">
          {formatCurrencyAmount(nativeCurrencyAmount, NumberType.TokenTx)}{' '}
          {nativeCurrencyInfo?.currency.symbol}
        </Text>
        <Text color="textSecondary" loading={!usdValue} variant="subheadSmall">
          ({formatUSDPrice(usdValue)})
        </Text>
      </Flex>
    </Flex>
  )
}
