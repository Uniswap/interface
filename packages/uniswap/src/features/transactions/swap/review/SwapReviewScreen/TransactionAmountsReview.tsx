import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, type FlexProps, Loader, ModalCloseIcon, Text, useMedia } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { iconSizes, validColor } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/utils/getTradeAmounts'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { isWebPlatform } from 'utilities/src/platform'

const SHORT_GAP: FlexProps['$short'] = { gap: '$spacing8' }

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
  const { convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()

  const {
    exactCurrencyField,
    trade: { trade, indicativeTrade },
  } = acceptedDerivedSwapInfo
  const displayTrade = trade ?? indicativeTrade
  const isBridgeTrade = (trade && isBridge(trade)) ?? false

  const priceUXEnabled = usePriceUXEnabled()
  const { inputCurrencyAmount, outputCurrencyAmount } = getTradeAmounts(acceptedDerivedSwapInfo, priceUXEnabled)

  // This should never happen. It's just to keep TS happy.
  if (!inputCurrencyAmount || !outputCurrencyAmount) {
    throw new Error('Missing required `currencyAmount` to render `TransactionAmountsReview`')
  }

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

  return (
    <Flex $short={SHORT_GAP} gap="$spacing16" ml="$spacing12" mr="$spacing12">
      <Flex row alignItems="center">
        <Flex fill>
          <Text color="$neutral2" variant="body2">
            {t('swap.review.summary')}
          </Text>
        </Flex>
        {isWebPlatform && (
          <Flex row centered gap="$spacing12">
            <ModalCloseIcon size="$icon.20" onClose={onClose} />
          </Flex>
        )}
      </Flex>

      {!currencyInInfo ? (
        <CurrencyValueWithIconSkeleton />
      ) : (
        <CurrencyValueWithIcon
          currencyInfo={currencyInInfo}
          formattedFiatAmount={formattedFiatAmountIn}
          formattedTokenAmount={formattedTokenAmountIn}
          indicative={isInputIndicative}
          shouldDim={shouldDimInput}
          isBridgeTrade={isBridgeTrade}
        />
      )}

      <ArrowDown color="$neutral3" size="$icon.20" />

      {!currencyOutInfo ? (
        <CurrencyValueWithIconSkeleton />
      ) : (
        <CurrencyValueWithIcon
          currencyInfo={currencyOutInfo}
          formattedFiatAmount={formattedFiatAmountOut}
          formattedTokenAmount={formattedTokenAmountOut}
          indicative={isOutputIndicative}
          shouldDim={shouldDimOutput}
          isBridgeTrade={isBridgeTrade}
        />
      )}
    </Flex>
  )
}

function CurrencyValueWithIconSkeleton(): JSX.Element {
  return <Loader.Box height={60} />
}

function CurrencyValueWithIcon({
  currencyInfo,
  formattedFiatAmount,
  formattedTokenAmount,
  shouldDim,
  indicative,
  isBridgeTrade,
}: {
  currencyInfo: CurrencyInfo
  formattedFiatAmount: string
  formattedTokenAmount: string
  shouldDim: boolean
  indicative: boolean
  isBridgeTrade: boolean
}): JSX.Element {
  const { defaultChainId } = useEnabledChains()
  const amountColor = indicative ? '$neutral2' : shouldDim ? '$neutral3' : '$neutral1'
  const fiatColor = indicative || shouldDim ? '$neutral3' : '$neutral2'

  const chainId = toSupportedChainId(currencyInfo.currency.chainId) ?? defaultChainId
  const networkColors = useNetworkColors(chainId)
  const networkLabel = getChainLabel(chainId)
  const networkColor = validColor(networkColors.foreground)
  const media = useMedia()

  const symbolDisplayText = useMemo(
    () => getSymbolDisplayText(currencyInfo.currency.symbol),
    [currencyInfo.currency.symbol],
  )

  // If you modify this UI, make sure to also modify the height of `CurrencyValueWithIconSkeleton`.
  return (
    <Flex centered grow row>
      <Flex grow gap="$spacing4">
        {isBridgeTrade && (
          <Flex row mt={media.sm ? '$spacing8' : undefined} gap="$spacing4" alignItems="center">
            <NetworkLogo chainId={currencyInfo.currency.chainId} size={iconSizes.icon16} />
            <Text color={networkColor} variant="buttonLabel3">
              {networkLabel}
            </Text>
          </Flex>
        )}
        <Text color={amountColor} variant="heading3">
          {formattedTokenAmount} {symbolDisplayText}
        </Text>

        <Text color={fiatColor} variant="body2">
          {formattedFiatAmount}
        </Text>
      </Flex>

      <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon40} />
    </Flex>
  )
}
