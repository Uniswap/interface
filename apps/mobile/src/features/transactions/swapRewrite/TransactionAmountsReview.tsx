import React from 'react'
import { useTranslation } from 'react-i18next'
import { DerivedSwapInfo } from 'src/features/transactions/swap/types'
import { Flex, Icons, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

export function TransactionAmountsReview({
  acceptedDerivedSwapInfo,
  currencyInInfo,
  currencyOutInfo,
  formattedFiatAmountIn,
  formattedFiatAmountOut,
  formattedTokenAmountIn,
  formattedTokenAmountOut,
  newTradeRequiresAcceptance,
}: {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  currencyInInfo: CurrencyInfo
  currencyOutInfo: CurrencyInfo
  formattedFiatAmountIn: string
  formattedFiatAmountOut: string
  formattedTokenAmountIn: string
  formattedTokenAmountOut: string
  newTradeRequiresAcceptance: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const { exactCurrencyField } = acceptedDerivedSwapInfo

  const shouldDimInput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.OUTPUT
  const shouldDimOutput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.INPUT

  return (
    <Flex $short={{ gap: '$spacing8' }} gap="$spacing16" ml="$spacing12" mr="$spacing12">
      <Text color="$neutral2" variant="body2">
        {t('You’re swapping')}
      </Text>

      <CurrencyValueWithIcon
        currencyInfo={currencyInInfo}
        formattedFiatAmount={formattedFiatAmountIn}
        formattedTokenAmount={formattedTokenAmountIn}
        shouldDim={shouldDimInput}
      />

      <Icons.ArrowDown color={colors.neutral3.get()} size={20} />

      <CurrencyValueWithIcon
        currencyInfo={currencyOutInfo}
        formattedFiatAmount={formattedFiatAmountOut}
        formattedTokenAmount={formattedTokenAmountOut}
        shouldDim={shouldDimOutput}
      />
    </Flex>
  )
}

function CurrencyValueWithIcon({
  currencyInfo,
  formattedFiatAmount,
  formattedTokenAmount,
  shouldDim,
}: {
  currencyInfo: CurrencyInfo
  formattedFiatAmount: string
  formattedTokenAmount: string
  shouldDim: boolean
}): JSX.Element {
  return (
    <Flex centered grow row>
      <Flex grow gap="$spacing4">
        <Text color={shouldDim ? '$neutral3' : '$neutral1'} variant="heading3">
          {formattedTokenAmount} {getSymbolDisplayText(currencyInfo.currency.symbol)}
        </Text>

        <Text color={shouldDim ? '$neutral3' : '$neutral2'} variant="body2">
          {formattedFiatAmount}
        </Text>
      </Flex>

      <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon40} />
    </Flex>
  )
}
