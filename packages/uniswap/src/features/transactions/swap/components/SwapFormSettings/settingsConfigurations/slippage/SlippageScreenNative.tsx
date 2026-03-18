import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColorTokens } from 'ui/src'
import { Flex, PlusMinusButton, PlusMinusButtonType, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { BottomSheetTextInput } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { MAX_CUSTOM_SLIPPAGE_TOLERANCE, SLIPPAGE_CRITICAL_TOLERANCE } from 'uniswap/src/constants/transactions'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'
import { useFormatSlippageAmount } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/useFormatSlippageAmount'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getSlippageWarningColor } from 'uniswap/src/features/transactions/swap/utils/styleHelpers'
import { isWebPlatform } from 'utilities/src/platform'

function SlippageMessage({
  inputWarning,
  trade,
  showSlippageWarning,
  showEmpty = true,
  color = '$statusWarning',
}: {
  inputWarning?: string
  trade: TradeWithSlippage | null
  showSlippageWarning: boolean
  showEmpty?: boolean
  color?: ColorTokens
}): JSX.Element | null {
  const { t } = useTranslation()

  const formattedSlippageAmount = useFormatSlippageAmount(trade)

  if (inputWarning) {
    return <WarningMessage showAlert text={inputWarning} color={color} />
  }

  return trade ? (
    <Flex centered gap="$spacing8" py="$spacing4">
      <Text color="$neutral2" textAlign="center" variant="body2">
        {[TradeType.EXACT_INPUT, 'EXACT_INPUT'].includes(trade.tradeType)
          ? t('swap.settings.slippage.input.receive.title')
          : t('swap.settings.slippage.output.spend.title')}{' '}
        {formattedSlippageAmount}
      </Text>
      {showSlippageWarning ? (
        <Flex centered row gap="$spacing8">
          <AlertTriangleFilled color={color} size="$icon.16" />
          <Text color="$statusWarning" variant="body2">
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

export function SlippageScreenNative(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const trade = useSwapFormStoreDerivedSwapInfo((s) => s.trade).trade

  const isBridgeTrade = trade instanceof BridgeTrade

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
  } = useSlippageSettings({ isZeroSlippage: isBridgeTrade })

  const inputValueTextColor = useMemo(
    () =>
      getSlippageWarningColor({
        customSlippageValue: currentSlippageTolerance,
        autoSlippageTolerance,
      }),
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
          trade={trade}
          color={inputValueTextColor}
        />
      )
    }
  }, [inputWarning, isBridgeTrade, showSlippageWarning, t, trade, inputValueTextColor])

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
                  ...(!isWebPlatform && {
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
}
