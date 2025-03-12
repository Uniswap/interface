import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ColorTokens,
  Flex,
  PlusMinusButton,
  PlusMinusButtonType,
  Text,
  TouchableArea,
  isWeb,
  useSporeColors,
} from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { BottomSheetTextInput } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { MAX_CUSTOM_SLIPPAGE_TOLERANCE, SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/settings/useSlippageSettings'
import { BridgeTrade, TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { getSlippageWarningColor } from 'uniswap/src/features/transactions/swap/utils/styleHelpers'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

export const Slippage: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
    const { t } = useTranslation()
    const { formatPercent } = useLocalizationContext()
    const { derivedSwapInfo } = useSwapFormContext()
    const acceptedTrade = derivedSwapInfo.trade.trade ?? derivedSwapInfo.trade.indicativeTrade
    const isBridgeTrade = derivedSwapInfo.trade.trade instanceof BridgeTrade
    const { currentSlippageTolerance, autoSlippageEnabled } = useSlippageSettings({
      tradeAutoSlippage: acceptedTrade?.slippageTolerance,
      isBridgeTrade,
    })

    return (
      <Flex row gap="$spacing8">
        {autoSlippageEnabled && !isBridgeTrade ? (
          <Flex centered backgroundColor="$accent2" borderRadius="$roundedFull" px="$spacing8">
            <Text color="$accent1" variant="buttonLabel3">
              {t('swap.settings.slippage.control.auto')}
            </Text>
          </Flex>
        ) : null}
        <Text color="$neutral2" variant="subheading2">
          {formatPercent(currentSlippageTolerance)}
        </Text>
      </Flex>
    )
  },
  Screen() {
    const { t } = useTranslation()
    const colors = useSporeColors()
    const { derivedSwapInfo } = useSwapFormContext()
    const { trade } = derivedSwapInfo.trade
    const acceptedTrade = derivedSwapInfo.trade.trade ?? derivedSwapInfo.trade.indicativeTrade

    const {
      isEditingSlippage,
      showSlippageWarning,
      inputSlippageTolerance,
      inputWarning,
      autoSlippageTolerance,
      currentSlippageTolerance,
      inputAnimatedStyle,
      onPressAutoSlippage,
      onChangeSlippageInput,
      onFocusSlippageInput,
      onBlurSlippageInput,
      onPressPlusMinusButton,
    } = useSlippageSettings({ tradeAutoSlippage: acceptedTrade?.slippageTolerance })

    const isBridgeTrade = trade instanceof BridgeTrade

    const inputValueTextColor = useMemo(
      () => getSlippageWarningColor(currentSlippageTolerance, autoSlippageTolerance),
      [currentSlippageTolerance, autoSlippageTolerance],
    )

    const slippageMessage = useMemo(() => {
      if (isBridgeTrade) {
        return <WarningMessage text={t('swap.slippage.bridging')} color="$neutral2" />
      } else {
        return (
          <SlippageMessage
            inputWarning={inputWarning}
            showSlippageWarning={showSlippageWarning}
            slippageTolerance={currentSlippageTolerance}
            trade={trade}
            color={inputValueTextColor}
          />
        )
      }
    }, [currentSlippageTolerance, inputWarning, isBridgeTrade, showSlippageWarning, t, trade, inputValueTextColor])

    return (
      <Flex centered gap="$spacing16">
        {!isBridgeTrade && (
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t('swap.settings.slippage.description')}
          </Text>
        )}
        {!isBridgeTrade && <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapSlippage} />}
        <Flex gap="$spacing12">
          <Flex centered row gap="$spacing16" mt="$spacing12">
            <PlusMinusButton
              disabled={currentSlippageTolerance === 0 || isBridgeTrade}
              type={PlusMinusButtonType.Minus}
              onPress={onPressPlusMinusButton}
            />
            <AnimatedFlex
              row
              alignItems="center"
              backgroundColor={isEditingSlippage || isBridgeTrade ? '$surface2' : '$surface1'}
              borderColor="$surface3"
              borderRadius="$roundedFull"
              borderWidth="$spacing1"
              gap="$spacing12"
              p="$spacing16"
              style={inputAnimatedStyle}
            >
              <TouchableArea onPress={isBridgeTrade ? undefined : onPressAutoSlippage}>
                <Text color="$accent1" variant="buttonLabel2">
                  {t('swap.settings.slippage.control.auto')}
                </Text>
              </TouchableArea>
              {isBridgeTrade ? (
                <Text color="$neutral2" textAlign="center" variant="subheading1">
                  0.00
                </Text>
              ) : (
                <BottomSheetTextInput
                  keyboardType="numeric"
                  style={{
                    color:
                      currentSlippageTolerance >= SLIPPAGE_CRITICAL_TOLERANCE
                        ? colors.statusCritical.val
                        : colors.neutral1.val,
                    fontSize: fonts.subheading1.fontSize,
                    width: fonts.subheading1.fontSize * 4,
                    padding: spacing.none,
                    ...(!isWeb && {
                      fontFamily: fonts.subheading1.family,
                    }),
                  }}
                  textAlign="center"
                  value={inputSlippageTolerance}
                  onBlur={onBlurSlippageInput}
                  onChangeText={onChangeSlippageInput}
                  onFocus={onFocusSlippageInput}
                />
              )}

              <Flex width={iconSizes.icon28}>
                <Text color="$neutral2" textAlign="center" variant="subheading1">
                  %
                </Text>
              </Flex>
            </AnimatedFlex>
            <PlusMinusButton
              disabled={currentSlippageTolerance === MAX_CUSTOM_SLIPPAGE_TOLERANCE || isBridgeTrade}
              type={PlusMinusButtonType.Plus}
              onPress={onPressPlusMinusButton}
            />
          </Flex>
          {slippageMessage}
        </Flex>
      </Flex>
    )
  },
}

function SlippageMessage({
  inputWarning,
  trade,
  slippageTolerance,
  showSlippageWarning,
  showEmpty = true,
  color = '$statusWarning',
}: {
  inputWarning?: string
  trade: TradeWithSlippage | null
  slippageTolerance: number
  showSlippageWarning: boolean
  showEmpty?: boolean
  color?: ColorTokens
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)

  if (inputWarning) {
    return <WarningMessage showAlert text={inputWarning} color={color} />
  }

  return trade ? (
    <Flex centered gap="$spacing8" py="$spacing4">
      <Text color="$neutral2" textAlign="center" variant="body2">
        {trade.tradeType === TradeType.EXACT_INPUT
          ? t('swap.settings.slippage.input.receive.title')
          : t('swap.settings.slippage.output.spend.title')}{' '}
        {formatCurrencyAmount({
          value: trade.minimumAmountOut(slippageTolerancePercent),
          type: NumberType.TokenTx,
        })}{' '}
        {getSymbolDisplayText(
          trade.tradeType === TradeType.EXACT_INPUT
            ? trade.outputAmount.currency.symbol
            : trade.inputAmount.currency.symbol,
        )}
      </Text>
      {showSlippageWarning ? (
        <Flex centered row gap="$spacing8">
          <AlertTriangleFilled color={color} size="$icon.16" />
          <Text color="$DEP_accentWarning" variant="body2">
            {t('swap.settings.slippage.warning.message')}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  ) : showEmpty ? (
    <Flex height={fonts.body2.lineHeight} />
  ) : null
}

function WarningMessage({
  text,
  color,
  showAlert = false,
}: {
  text: string
  color: ColorTokens
  showAlert?: boolean
}): JSX.Element {
  return (
    <Flex row centered px="$spacing12" gap="$spacing8" height={fonts.body3.lineHeight * 2 + spacing.spacing8}>
      {showAlert && <AlertTriangleFilled color={color} size="$icon.16" />}
      <Text color={color} textAlign="center" variant="body3">
        {text}
      </Text>
    </Flex>
  )
}
