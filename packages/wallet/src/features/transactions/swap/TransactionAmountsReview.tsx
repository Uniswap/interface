import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, isWeb, useSporeColors } from 'ui/src'
import { ArrowDown, X } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'

export function TransactionAmountsReview({
  acceptedDerivedSwapInfo,
  newTradeRequiresAcceptance,
  onClose,
}: {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  newTradeRequiresAcceptance: boolean
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()
  const { currencyAmountsUSDValue, exactCurrencyField, trade } = acceptedDerivedSwapInfo

  if (!trade.trade) {
    throw new Error('Missing required `trade` to render `TransactionAmountsReview`')
  }

  // Token amounts
  // On review screen, always show values directly from trade object, to match exactly what is submitted on chain
  const inputCurrencyAmount = trade.trade.inputAmount
  const outputCurrencyAmount = trade.trade.outputAmount

  const formattedTokenAmountIn = formatCurrencyAmount({
    value: inputCurrencyAmount,
    type: NumberType.TokenTx,
  })
  const formattedTokenAmountOut = formatCurrencyAmount({
    value: outputCurrencyAmount,
    type: NumberType.TokenTx,
  })

  // USD amounts
  const usdAmountIn = currencyAmountsUSDValue[CurrencyField.INPUT]?.toExact()
  const usdAmountOut = currencyAmountsUSDValue[CurrencyField.OUTPUT]?.toExact()
  const formattedFiatAmountIn = convertFiatAmountFormatted(usdAmountIn, NumberType.FiatTokenQuantity)
  const formattedFiatAmountOut = convertFiatAmountFormatted(usdAmountOut, NumberType.FiatTokenQuantity)

  const shouldDimInput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.OUTPUT
  const shouldDimOutput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.INPUT

  // Rebuild currency infos directly from trade object to ensure it matches what is submitted on chain
  const currencyInInfo = useCurrencyInfo(
    buildCurrencyId(inputCurrencyAmount.currency.chainId, currencyAddress(inputCurrencyAmount.currency)),
  )
  const currencyOutInfo = useCurrencyInfo(
    buildCurrencyId(outputCurrencyAmount.currency.chainId, currencyAddress(outputCurrencyAmount.currency)),
  )

  if (!currencyInInfo || !currencyOutInfo) {
    // This should never happen. It's just to keep TS happy.
    throw new Error('Missing required props in `derivedSwapInfo` to render `TransactionAmountsReview` screen.')
  }

  return (
    <Flex $short={{ gap: '$spacing8' }} gap="$spacing16" ml="$spacing12" mr="$spacing12">
      <Flex row alignItems="center">
        <Flex fill>
          <Text color="$neutral2" variant="body2">
            {t('swap.review.summary')}
          </Text>
        </Flex>
        {isWeb && (
          <Button
            backgroundColor="$transparent"
            color="$neutral2"
            icon={<X size="$icon.20" />}
            p="$none"
            theme="secondary"
            onClick={onClose}
          />
        )}
      </Flex>

      <CurrencyValueWithIcon
        currencyInfo={currencyInInfo}
        formattedFiatAmount={formattedFiatAmountIn}
        formattedTokenAmount={formattedTokenAmountIn}
        shouldDim={shouldDimInput}
      />

      <ArrowDown color={colors.neutral3.get()} size={20} />

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
