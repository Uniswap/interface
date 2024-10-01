import { TradeType } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { PlusMinusButton, PlusMinusButtonType } from 'ui/src/components/button/PlusMinusButton'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { BottomSheetTextInput } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { MAX_AUTO_SLIPPAGE_TOLERANCE, MAX_CUSTOM_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/settings/useSlippageSettings'
import { BridgeTrade, TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

export const Slippage: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
    const { t } = useTranslation()
    const { formatPercent } = useLocalizationContext()
    const { derivedSwapInfo } = useSwapFormContext()

    const { customSlippageTolerance, autoSlippageTolerance } = derivedSwapInfo
    const isCustomSlippage = !!customSlippageTolerance
    let currentSlippage = customSlippageTolerance ?? autoSlippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE
    if (autoSlippageTolerance && currentSlippage === 0) {
      currentSlippage = autoSlippageTolerance
    }

    return (
      <Flex row gap="$spacing8">
        {!isCustomSlippage ? (
          <Flex centered backgroundColor="$accent2" borderRadius="$roundedFull" px="$spacing8">
            <Text color="$accent1" variant="buttonLabel3">
              {t('swap.settings.slippage.control.auto')}
            </Text>
          </Flex>
        ) : null}
        <Text color="$neutral2" variant="subheading2">
          {formatPercent(currentSlippage)}
        </Text>
      </Flex>
    )
  },
  Screen() {
    const { t } = useTranslation()
    const colors = useSporeColors()
    const {
      derivedSwapInfo: {
        trade: { trade },
      },
    } = useSwapFormContext()

    const {
      isEditingSlippage,
      autoSlippageEnabled,
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
    } = useSlippageSettings()

    if (trade instanceof BridgeTrade) {
      // Check exists to make sure trade conforms to TradeWithSlippage,
      // since this component should not be rendered for bridge trades which don't have slippage
      return null
    }

    return (
      <Flex centered gap="$spacing16">
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('swap.settings.slippage.description')}
        </Text>
        <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapSlippage} />
        <Flex gap="$spacing12">
          <Flex centered row gap="$spacing16" mt="$spacing12">
            <PlusMinusButton
              disabled={currentSlippageTolerance === 0}
              type={PlusMinusButtonType.Minus}
              onPress={onPressPlusMinusButton}
            />
            <AnimatedFlex
              row
              alignItems="center"
              backgroundColor={isEditingSlippage ? '$surface2' : '$surface1'}
              borderColor="$surface3"
              borderRadius="$roundedFull"
              borderWidth={1}
              gap="$spacing12"
              p="$spacing16"
              style={inputAnimatedStyle}
            >
              <TouchableArea hapticFeedback onPress={onPressAutoSlippage}>
                <Text color="$accent1" variant="buttonLabel2">
                  {t('swap.settings.slippage.control.auto')}
                </Text>
              </TouchableArea>
              <BottomSheetTextInput
                keyboardType="numeric"
                style={{
                  color: autoSlippageEnabled ? colors.neutral2.get() : colors.neutral1.get(),
                  fontSize: fonts.subheading1.fontSize,
                  width: fonts.subheading1.fontSize * 4,
                  padding: spacing.none,
                  ...(!isWeb && {
                    fontFamily: fonts.subheading1.family,
                  }),
                }}
                textAlign="center"
                value={autoSlippageEnabled ? autoSlippageTolerance.toFixed(2).toString() : inputSlippageTolerance}
                onBlur={onBlurSlippageInput}
                onChangeText={onChangeSlippageInput}
                onFocus={onFocusSlippageInput}
              />
              <Flex width={iconSizes.icon28}>
                <Text color="$neutral2" textAlign="center" variant="subheading1">
                  %
                </Text>
              </Flex>
            </AnimatedFlex>
            <PlusMinusButton
              disabled={currentSlippageTolerance === MAX_CUSTOM_SLIPPAGE_TOLERANCE}
              type={PlusMinusButtonType.Plus}
              onPress={onPressPlusMinusButton}
            />
          </Flex>
          <SlippageMessage
            inputWarning={inputWarning}
            showSlippageWarning={showSlippageWarning}
            slippageTolerance={currentSlippageTolerance}
            trade={trade}
          />
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
}: {
  inputWarning?: string
  trade: TradeWithSlippage | null
  slippageTolerance: number
  showSlippageWarning: boolean
  showEmpty?: boolean
}): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)

  if (inputWarning) {
    return (
      <Flex centered row gap="$spacing8" height={fonts.body2.lineHeight * 2 + spacing.spacing8}>
        <AlertTriangleFilled color="$DEP_accentWarning" size="$icon.16" />
        <Text color="$DEP_accentWarning" textAlign="center" variant="body2">
          {inputWarning}
        </Text>
      </Flex>
    )
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
          <AlertTriangleFilled color={colors.DEP_accentWarning.val} size="$icon.16" />
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
