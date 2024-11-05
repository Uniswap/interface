import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { HelpCenter } from 'ui/src/components/icons/HelpCenter'
import { X } from 'ui/src/components/icons/X'
import { iconSizes, validColor } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/hooks/getTradeAmounts'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { openUri } from 'uniswap/src/utils/linking'
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

  const isBridgingEnabled = useFeatureFlag(FeatureFlags.Bridging)

  const {
    exactCurrencyField,
    trade: { trade, indicativeTrade },
  } = acceptedDerivedSwapInfo
  const displayTrade = trade ?? indicativeTrade
  const isBridgeTrade = (isBridgingEnabled && trade && isBridge(trade)) ?? false

  const { inputCurrencyAmount, outputCurrencyAmount } = getTradeAmounts(acceptedDerivedSwapInfo)

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

  const onPressGetHelp = async (): Promise<void> => {
    await openUri(uniswapUrls.helpUrl)
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
          <Flex row centered gap="$spacing12">
            <TouchableArea
              hoverable
              p="$padding6"
              borderColor="$surface3"
              borderWidth={1}
              borderRadius="$rounded12"
              onPress={onPressGetHelp}
            >
              <Flex row centered gap="$spacing4">
                <HelpCenter color="$neutral1" size="$icon.16" />{' '}
                <Text variant="body4" color="$neutral1">
                  {t('common.getHelp.button')}
                </Text>
              </Flex>
            </TouchableArea>
            <Button
              backgroundColor="$transparent"
              color="$neutral2"
              icon={<X size="$icon.20" />}
              p="$none"
              theme="secondary"
              onPress={onClose}
            />
          </Flex>
        )}
      </Flex>

      <CurrencyValueWithIcon
        currencyInfo={currencyInInfo}
        formattedFiatAmount={formattedFiatAmountIn}
        formattedTokenAmount={formattedTokenAmountIn}
        indicative={isInputIndicative}
        shouldDim={shouldDimInput}
        isBridgeTrade={isBridgeTrade}
      />

      <ArrowDown color={colors.neutral3.get()} size={20} />

      <CurrencyValueWithIcon
        currencyInfo={currencyOutInfo}
        formattedFiatAmount={formattedFiatAmountOut}
        formattedTokenAmount={formattedTokenAmountOut}
        indicative={isOutputIndicative}
        shouldDim={shouldDimOutput}
        isBridgeTrade={isBridgeTrade}
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
  const networkLabel = UNIVERSE_CHAIN_INFO[chainId].label
  const networkColor = validColor(networkColors.foreground)

  return (
    <Flex centered grow row>
      <Flex grow gap="$spacing4">
        {isBridgeTrade && (
          <Flex row gap="$spacing4" alignItems="center">
            <NetworkLogo chainId={currencyInfo.currency.chainId} size={iconSizes.icon16} />
            <Text color={networkColor} variant="buttonLabel3">
              {networkLabel}
            </Text>
          </Flex>
        )}
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
