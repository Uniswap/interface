import { isWebPlatform } from '@universe/environment'
import { iconSizes, validColor } from '@universe/mycelium'
import { type ReviewAmount, ReviewSummary } from '@universe/transactions-ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/utils/getTradeAmounts'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'

export function TransactionAmountsReview({
  acceptedDerivedSwapInfo,
  quoteRefreshField,
  newTradeRequiresAcceptance,
  onClose,
}: {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  quoteRefreshField?: CurrencyField
  newTradeRequiresAcceptance: boolean
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()

  const {
    exactCurrencyField,
    trade: { trade, indicativeTrade },
  } = acceptedDerivedSwapInfo
  const displayTrade = trade ?? indicativeTrade
  const { inputCurrencyAmount, outputCurrencyAmount } = getTradeAmounts(acceptedDerivedSwapInfo)

  // This should never happen. It's just to keep TS happy.
  if (!inputCurrencyAmount || !outputCurrencyAmount) {
    throw new Error('Missing required `currencyAmount` to render `TransactionAmountsReview`')
  }

  const isCrossChainSwap = inputCurrencyAmount.currency.chainId !== outputCurrencyAmount.currency.chainId

  const formattedTokenAmountIn = useMemo(
    () =>
      formatCurrencyAmount({
        value: inputCurrencyAmount,
        type: NumberType.TokenTx,
      }),
    [formatCurrencyAmount, inputCurrencyAmount],
  )
  const formattedTokenAmountOut = useMemo(
    () =>
      formatCurrencyAmount({
        value: outputCurrencyAmount,
        type: NumberType.TokenTx,
      }),
    [formatCurrencyAmount, outputCurrencyAmount],
  )

  // USD amount
  const usdAmountIn = useUSDCValue(inputCurrencyAmount)
  const usdAmountOut = useUSDCValue(outputCurrencyAmount)
  const formattedFiatAmountIn = useMemo(
    () => convertFiatAmountFormatted(usdAmountIn?.toExact(), NumberType.FiatTokenQuantity),
    [convertFiatAmountFormatted, usdAmountIn],
  )
  const formattedFiatAmountOut = useMemo(
    () => convertFiatAmountFormatted(usdAmountOut?.toExact(), NumberType.FiatTokenQuantity),
    [convertFiatAmountFormatted, usdAmountOut],
  )

  const shouldDimInput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.OUTPUT
  const shouldDimOutput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.INPUT
  const isInputAmountLoading = quoteRefreshField === CurrencyField.INPUT
  const isOutputAmountLoading = quoteRefreshField === CurrencyField.OUTPUT

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
    // This should never happen given that all the data required to get these two objects should be readily available in the Review screen.
    // This might be happening because the `Token` query is somehow not in the cache,
    // which only started happening on mobile 1.43 and we don't know why.
    // As a temporary fix, we've added a Skeleton UI to this component,
    // but ideally this should not be necessary.
    logger.warn(
      'TransactionAmountsReview.tsx',
      'TransactionAmountsReview',
      'Missing required `currencyInInfo` or `currencyOutInfo` when rendering `TransactionAmountsReview`',
      {
        acceptedDerivedSwapInfo,
        inputCurrencyAmount,
        outputCurrencyAmount,
      },
    )
  }

  const input = useReviewAmount({
    currencyInfo: currencyInInfo,
    formattedTokenAmount: formattedTokenAmountIn,
    formattedFiatAmount: formattedFiatAmountIn,
    indicative: isInputIndicative,
    shouldDim: shouldDimInput,
    isAmountLoading: isInputAmountLoading,
    isCrossChainSwap,
  })
  const output = useReviewAmount({
    currencyInfo: currencyOutInfo,
    formattedTokenAmount: formattedTokenAmountOut,
    formattedFiatAmount: formattedFiatAmountOut,
    indicative: isOutputIndicative,
    shouldDim: shouldDimOutput,
    isAmountLoading: isOutputAmountLoading,
    isCrossChainSwap,
  })

  return (
    <ReviewSummary
      input={input}
      output={output}
      title={t('swap.review.summary')}
      onClose={isWebPlatform ? onClose : undefined}
    />
  )
}

/** Maps one side of the trade onto ReviewSummary. `null` (no currency info) renders the skeleton row. */
function useReviewAmount({
  currencyInfo,
  formattedFiatAmount,
  formattedTokenAmount,
  shouldDim,
  indicative,
  isAmountLoading,
  isCrossChainSwap,
}: {
  currencyInfo: Maybe<CurrencyInfo>
  formattedFiatAmount: string
  formattedTokenAmount: string
  shouldDim: boolean
  indicative: boolean
  isAmountLoading: boolean
  isCrossChainSwap: boolean
}): ReviewAmount | null {
  const { defaultChainId } = useEnabledChains()
  const chainId = toSupportedChainId(currencyInfo?.currency.chainId) ?? defaultChainId
  const networkColors = useNetworkColors(chainId)

  if (!currencyInfo) {
    return null
  }

  return {
    amount: formattedTokenAmount,
    // Raw symbol: ReviewSummary truncates it by width. An empty string renders no symbol.
    symbol: currencyInfo.currency.symbol ?? '',
    fiat: formattedFiatAmount,
    logo: <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon40} />,
    state: indicative ? 'indicative' : shouldDim ? 'dimmed' : 'default',
    isAmountLoading,
    network: isCrossChainSwap
      ? {
          label: getChainLabel(chainId),
          color: validColor(networkColors.foreground),
          logo: <NetworkLogo chainId={currencyInfo.currency.chainId} size={iconSizes.icon16} />,
        }
      : undefined,
  }
}
