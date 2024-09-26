import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, isWeb, useSporeColors } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

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
  const {
    exactCurrencyField,
    trade: { trade, indicativeTrade },
    wrapType,
    currencyAmounts,
  } = acceptedDerivedSwapInfo
  const displayTrade = trade ?? indicativeTrade

  const isWrap = wrapType !== WrapType.NotApplicable

  // For wraps, we need to detect if WETH is input or output, because we have logic in `useDerivedSwapInfo` that
  // sets both currencAmounts to native currency, which would result in native ETH as both tokens for this UI.
  const wrapInputCurrencyAmount =
    wrapType === WrapType.Wrap ? currencyAmounts[CurrencyField.INPUT] : currencyAmounts[CurrencyField.INPUT]?.wrapped
  const wrapOutputCurrencyAmount =
    wrapType === WrapType.Wrap ? currencyAmounts[CurrencyField.OUTPUT]?.wrapped : currencyAmounts[CurrencyField.OUTPUT]

  // Token amounts
  // On review screen, always show values directly from trade object, to match exactly what is submitted on chain
  // For wraps, we have no trade object so use values from form state
  const inputCurrencyAmount = isWrap ? wrapInputCurrencyAmount : displayTrade?.inputAmount
  const outputCurrencyAmount = isWrap ? wrapOutputCurrencyAmount : displayTrade?.outputAmount

  // This should never happen. It's just to keep TS happy.
  if (!inputCurrencyAmount || !outputCurrencyAmount) {
    throw new Error('Missing required `currencyAmount` to render `TransactionAmountsReview`')
  }

  const formattedTokenAmountIn = formatCurrencyAmount({
    value: inputCurrencyAmount,
    type: NumberType.TokenTx,
  })
  const formattedTokenAmountOut = formatCurrencyAmount({
    value: outputCurrencyAmount,
    type: NumberType.TokenTx,
  })

  // USD amount
  const usdAmountIn = useUSDCValue(inputCurrencyAmount)
  const usdAmountOut = useUSDCValue(outputCurrencyAmount)
  const formattedFiatAmountIn = convertFiatAmountFormatted(usdAmountIn?.toExact(), NumberType.FiatTokenQuantity)
  const formattedFiatAmountOut = convertFiatAmountFormatted(usdAmountOut?.toExact(), NumberType.FiatTokenQuantity)

  const shouldDimInput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.OUTPUT
  const shouldDimOutput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.INPUT

  const isInputIndicative = Boolean(displayTrade?.indicative && exactCurrencyField === CurrencyField.OUTPUT)
  const isOutputIndicative = Boolean(displayTrade?.indicative && exactCurrencyField === CurrencyField.INPUT)

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
            onPress={onClose}
          />
        )}
      </Flex>

      <CurrencyValueWithIcon
        currencyInfo={currencyInInfo}
        formattedFiatAmount={formattedFiatAmountIn}
        formattedTokenAmount={formattedTokenAmountIn}
        indicative={isInputIndicative}
        shouldDim={shouldDimInput}
      />

      <ArrowDown color={colors.neutral3.get()} size={20} />

      <CurrencyValueWithIcon
        currencyInfo={currencyOutInfo}
        formattedFiatAmount={formattedFiatAmountOut}
        formattedTokenAmount={formattedTokenAmountOut}
        indicative={isOutputIndicative}
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
  indicative,
}: {
  currencyInfo: CurrencyInfo
  formattedFiatAmount: string
  formattedTokenAmount: string
  shouldDim: boolean
  indicative: boolean
}): JSX.Element {
  const amountColor = indicative ? '$neutral2' : shouldDim ? '$neutral3' : '$neutral1'
  const fiatColor = indicative || shouldDim ? '$neutral3' : '$neutral2'

  return (
    <Flex centered grow row>
      <Flex grow gap="$spacing4">
        <Text color={amountColor} variant="heading3">
          {formattedTokenAmount} {getSymbolDisplayText(currencyInfo.currency.symbol)}
        </Text>

        <Text color={fiatColor} variant="body2">
          {formattedFiatAmount}
        </Text>
      </Flex>

      <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon40} />
    </Flex>
  )
}
