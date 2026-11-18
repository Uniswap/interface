import { TradeType } from '@uniswap/sdk-core'
import { SlippageScreen } from '@universe/transactions-ui'
import { useTranslation } from 'react-i18next'
import { BottomSheetTextInput } from 'uniswap/src/components/modals/Modal'
import { MAX_CUSTOM_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { PlusMinusButtonType } from 'uniswap/src/features/transactions/components/settings/PlusMinusButton'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'
import { useFormatSlippageAmount } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/useFormatSlippageAmount'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getSlippageWarningLevel } from 'uniswap/src/features/transactions/swap/utils/styleHelpers'
import { openUri } from 'uniswap/src/utils/linking'

// LearnMoreLink's TouchableTextLink opened the article outside the app, with Linking.openURL.
const onPressLearnMore = (): Promise<void> =>
  openUri({ uri: UniswapHelpUrls.articles.swapSlippage, openExternalBrowser: true })

export function SlippageScreenNative(): JSX.Element {
  const { t } = useTranslation()
  const trade = useSwapFormStoreDerivedSwapInfo((s) => s.trade).trade

  const isBridgeTrade = Boolean(trade && isBridge(trade))
  const tradeWithSlippage = trade && !isBridge(trade) ? trade : null

  const {
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

  const formattedSlippageAmount = useFormatSlippageAmount(tradeWithSlippage)

  // Paints the typed value, the input warning and the "higher than necessary" line, as
  // getSlippageWarningColor did for each of them.
  const warningLevel = getSlippageWarningLevel({
    customSlippageValue: currentSlippageTolerance,
    autoSlippageTolerance,
  })

  const amount = tradeWithSlippage
    ? {
        isExactInput: [TradeType.EXACT_INPUT, 'EXACT_INPUT'].includes(tradeWithSlippage.tradeType),
        formattedAmount: formattedSlippageAmount,
      }
    : undefined

  function onPressIncrement(): void {
    onPressPlusMinusButton(PlusMinusButtonType.Plus)
  }

  function onPressDecrement(): void {
    onPressPlusMinusButton(PlusMinusButtonType.Minus)
  }

  return (
    <SlippageScreen
      value={inputSlippageTolerance}
      warningLevel={warningLevel}
      errorMessage={inputWarning}
      amount={amount}
      noSlippageReason={isBridgeTrade ? t('swap.slippage.bridging') : undefined}
      isAtMinimum={currentSlippageTolerance === 0}
      isAtMaximum={currentSlippageTolerance === MAX_CUSTOM_SLIPPAGE_TOLERANCE}
      TextInputComponent={BottomSheetTextInput}
      shakeStyle={inputAnimatedStyle}
      onChangeValue={onChangeSlippageInput}
      onFocus={onFocusSlippageInput}
      onBlur={onBlurSlippageInput}
      onPressAuto={onPressAutoSlippage}
      onPressIncrement={onPressIncrement}
      onPressDecrement={onPressDecrement}
      onPressLearnMore={onPressLearnMore}
    />
  )
}
