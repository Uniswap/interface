import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

export function TransactionAmountsReview({
  currencyInInfo,
  currencyOutInfo,
  formattedFiatAmountIn,
  formattedFiatAmountOut,
  formattedTokenAmountIn,
  formattedTokenAmountOut,
}: {
  currencyInInfo: CurrencyInfo
  currencyOutInfo: CurrencyInfo
  formattedFiatAmountIn: string
  formattedFiatAmountOut: string
  formattedTokenAmountIn: string
  formattedTokenAmountOut: string
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Flex $short={{ gap: '$spacing8' }} gap="$spacing16" ml="$spacing12" mr="$spacing12">
      <Text color="$neutral2" variant="body2">
        {t('You’re swapping')}
      </Text>

      <CurrencyValueWithIcon
        currencyInfo={currencyInInfo}
        formattedFiatAmount={formattedFiatAmountIn}
        formattedTokenAmount={formattedTokenAmountIn}
      />

      <Icons.ArrowDown color={colors.neutral3.get()} size={20} />

      <CurrencyValueWithIcon
        currencyInfo={currencyOutInfo}
        formattedFiatAmount={formattedFiatAmountOut}
        formattedTokenAmount={formattedTokenAmountOut}
      />
    </Flex>
  )
}

function CurrencyValueWithIcon({
  currencyInfo,
  formattedFiatAmount,
  formattedTokenAmount,
}: {
  currencyInfo: CurrencyInfo
  formattedFiatAmount: string
  formattedTokenAmount: string
}): JSX.Element {
  return (
    <Flex centered grow row>
      <Flex grow gap="$spacing4">
        <Text color="$neutral1" variant="heading3">
          {formattedTokenAmount} {getSymbolDisplayText(currencyInfo.currency.symbol)}
        </Text>

        <Text color="$neutral2" variant="body2">
          {formattedFiatAmount}
        </Text>
      </Flex>

      <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon40} />
    </Flex>
  )
}
