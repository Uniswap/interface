/* eslint-disable max-lines */
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { impactAsync } from 'expo-haptics'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { isWeb } from 'tamagui'
import { AnimatedFlex, Button, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import PlusMinusButton, { PlusMinusButtonType } from 'wallet/src/components/buttons/PlusMinusButton'
import { Switch } from 'wallet/src/components/buttons/Switch'
import {
  BottomSheetModal,
  BottomSheetTextInput,
} from 'wallet/src/components/modals/BottomSheetModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import {
  MAX_AUTO_SLIPPAGE_TOLERANCE,
  MAX_CUSTOM_SLIPPAGE_TOLERANCE,
} from 'wallet/src/constants/transactions'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { SwapProtectionInfoModal } from 'wallet/src/features/transactions/swap/modals/SwapProtectionModal'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { slippageToleranceToPercent } from 'wallet/src/features/transactions/swap/utils'
import { useSwapProtectionSetting } from 'wallet/src/features/wallet/hooks'
import { setSwapProtectionSetting, SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { useAppDispatch } from 'wallet/src/state'
import { ModalName } from 'wallet/src/telemetry/constants'
import { errorShakeAnimation } from 'wallet/src/utils/animations'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

const SLIPPAGE_INCREMENT = 0.1

enum SwapSettingsModalView {
  Options,
  Slippage,
}

export type SwapSettingsModalProps = {
  derivedSwapInfo: DerivedSwapInfo
  setCustomSlippageTolerance: (customSlippageTolerance: number | undefined) => void
  onClose?: () => void
}

// NOTE: This modal is shared between the old and new swap flows!
//       If you make changes to this modal, make sure it works for both flows.
export function SwapSettingsModal({
  derivedSwapInfo,
  setCustomSlippageTolerance,
  onClose,
}: SwapSettingsModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const [view, setView] = useState(SwapSettingsModalView.Options)

  const { customSlippageTolerance, autoSlippageTolerance, chainId } = derivedSwapInfo
  const isCustomSlippage = !!customSlippageTolerance
  const currentSlippage =
    customSlippageTolerance ?? autoSlippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE

  const getTitle = (): string => {
    switch (view) {
      case SwapSettingsModalView.Options:
        return t('Swap Settings')
      case SwapSettingsModalView.Slippage:
        return t('Slippage Settings')
    }
  }

  const innerContent = useMemo(() => {
    switch (view) {
      case SwapSettingsModalView.Options:
        return (
          <SwapSettingsOptions
            chainId={chainId}
            isCustomSlippage={isCustomSlippage}
            setView={setView}
            slippage={currentSlippage}
          />
        )
      case SwapSettingsModalView.Slippage:
        return (
          <SlippageSettings
            derivedSwapInfo={derivedSwapInfo}
            setCustomSlippageTolerance={setCustomSlippageTolerance}
          />
        )
    }
  }, [
    chainId,
    currentSlippage,
    derivedSwapInfo,
    isCustomSlippage,
    setCustomSlippageTolerance,
    view,
  ])

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      name={ModalName.SwapSettings}
      onClose={onClose}>
      <Flex gap="$spacing16" px="$spacing24" py="$spacing12">
        <Flex row justifyContent="space-between">
          <TouchableArea onPress={(): void => setView(SwapSettingsModalView.Options)}>
            <Icons.RotatableChevron
              color={view === SwapSettingsModalView.Options ? '$transparent' : '$neutral3'}
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </TouchableArea>
          <Text textAlign="center" variant="body1">
            {getTitle()}
          </Text>
          <Flex width={iconSizes.icon24} />
        </Flex>
        {innerContent}
        <Flex centered row>
          <Button fill testID="swap-settings-close" theme="secondary" onPress={onClose}>
            {t('Close')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function SwapSettingsOptions({
  slippage,
  isCustomSlippage,
  setView,
  chainId,
}: {
  slippage: number
  isCustomSlippage: boolean
  setView: (newView: SwapSettingsModalView) => void
  chainId: ChainId
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const isMevBlockerFeatureEnabled = useFeatureFlag(FEATURE_FLAGS.MevBlocker)

  return (
    <Flex fill gap="$spacing16" py="$spacing12">
      <Flex fill row justifyContent="space-between">
        <Text color="$neutral1" variant="subheading2">
          {t('Max slippage')}
        </Text>
        <TouchableArea onPress={(): void => setView(SwapSettingsModalView.Slippage)}>
          <Flex row gap="$spacing8">
            {!isCustomSlippage ? (
              <Flex centered bg="$accent2" borderRadius="$roundedFull" px="$spacing8">
                <Text color="$accent1" variant="buttonLabel4">
                  {t('Auto')}
                </Text>
              </Flex>
            ) : null}
            <Text color="$neutral2" variant="subheading2">
              {formatPercent(slippage)}
            </Text>
            <Icons.RotatableChevron
              color="$neutral3"
              direction="end"
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </Flex>
        </TouchableArea>
      </Flex>
      {isMevBlockerFeatureEnabled && <SwapProtectionSettingsRow chainId={chainId} />}
    </Flex>
  )
}

function SwapProtectionSettingsRow({ chainId }: { chainId: ChainId }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const swapProtectionSetting = useSwapProtectionSetting()

  const toggleSwapProtectionSetting = useCallback(() => {
    if (swapProtectionSetting === SwapProtectionSetting.On) {
      dispatch(setSwapProtectionSetting({ newSwapProtectionSetting: SwapProtectionSetting.Off }))
    }
    if (swapProtectionSetting === SwapProtectionSetting.Off) {
      dispatch(setSwapProtectionSetting({ newSwapProtectionSetting: SwapProtectionSetting.On }))
    }
  }, [dispatch, swapProtectionSetting])

  const [showInfoModal, setShowInfoModal] = useState(false)

  const privateRpcSupportedOnChain = isPrivateRpcSupportedOnChain(chainId)
  const chainName = CHAIN_INFO[chainId].label
  const subText = privateRpcSupportedOnChain
    ? t('{{chainName}} Network', { chainName })
    : t('Not available on {{chainName}}', { chainName })

  return (
    <>
      {showInfoModal && <SwapProtectionInfoModal onClose={(): void => setShowInfoModal(false)} />}
      <Flex fill gap="$spacing16">
        <Flex fill bg="$surface3" height={1} />
        <Flex fill row justifyContent="space-between">
          <TouchableArea onPress={(): void => setShowInfoModal(true)}>
            <Flex gap="$spacing4">
              <Flex row alignItems="center" gap="$spacing4">
                <Text color="$neutral1" variant="subheading2">
                  {t('Swap protection')}
                </Text>
                <Icons.InfoCircleFilled color="$neutral3" size={iconSizes.icon16} />
              </Flex>
              <Text color="$neutral2" variant="body3">
                {subText}
              </Text>
            </Flex>
          </TouchableArea>
          <Switch
            disabled={!privateRpcSupportedOnChain}
            value={privateRpcSupportedOnChain && swapProtectionSetting === SwapProtectionSetting.On}
            onValueChange={toggleSwapProtectionSetting}
          />
        </Flex>
      </Flex>
    </>
  )
}

function SlippageSettings({
  derivedSwapInfo,
  setCustomSlippageTolerance,
}: SwapSettingsModalProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const {
    customSlippageTolerance,
    autoSlippageTolerance: derivedAutoSlippageTolerance,
    trade: tradeWithStatus,
  } = derivedSwapInfo
  const trade = tradeWithStatus.trade

  const [isEditingSlippage, setIsEditingSlippage] = useState<boolean>(false)
  const [autoSlippageEnabled, setAutoSlippageEnabled] = useState<boolean>(!customSlippageTolerance)
  const [inputSlippageTolerance, setInputSlippageTolerance] = useState<string>(
    customSlippageTolerance?.toFixed(2)?.toString() ?? ''
  )
  const [inputWarning, setInputWarning] = useState<string | undefined>()

  // Fall back to default slippage if there is no trade specified.
  // Separate from inputSlippageTolerance since autoSlippage updates when the trade quote updates
  const autoSlippageTolerance = derivedAutoSlippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE

  // Determine numerical currentSlippage value to use based on inputSlippageTolerance string value
  // ex. if inputSlippageTolerance is '' or '.', currentSlippage is set to autoSlippageTolerance
  const parsedInputSlippageTolerance = parseFloat(inputSlippageTolerance)
  const currentSlippageToleranceNum = isNaN(parsedInputSlippageTolerance)
    ? autoSlippageTolerance
    : parsedInputSlippageTolerance

  // Make input text the warning color if user is setting custom slippage higher than auto slippage value or 0
  const showSlippageWarning = parsedInputSlippageTolerance > autoSlippageTolerance

  const inputShakeX = useSharedValue(0)
  const inputAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: inputShakeX.value }],
    }),
    [inputShakeX]
  )

  const onPressAutoSlippage = (): void => {
    setAutoSlippageEnabled(true)
    setInputWarning(undefined)
    setInputSlippageTolerance('')
    setCustomSlippageTolerance(undefined)
  }

  const onChangeSlippageInput = useCallback(
    async (value: string): Promise<void> => {
      setAutoSlippageEnabled(false)
      setInputWarning(undefined)

      // Handle keyboards that use `,` as decimal separator
      value = value.replace(',', '.')

      // Allow empty input value and single decimal point
      if (value === '' || value === '.') {
        setInputSlippageTolerance(value)
        return
      }

      const parsedValue = parseFloat(value)

      // Validate input and prevent invalid updates with animation
      const isInvalidNumber = isNaN(parsedValue)
      const overMaxTolerance = parsedValue > MAX_CUSTOM_SLIPPAGE_TOLERANCE
      const decimalParts = value.split('.')
      const moreThanOneDecimalSymbol = decimalParts.length > 2
      const moreThanTwoDecimals = decimalParts?.[1] && decimalParts?.[1].length > 2
      const isZero = parsedValue === 0

      if (isZero) {
        setInputWarning(t('Enter a value larger than 0'))
      }

      if (overMaxTolerance) {
        setInputWarning(
          t('Enter a value less than {{ maxSlippageTolerance }}', {
            maxSlippageTolerance: MAX_CUSTOM_SLIPPAGE_TOLERANCE,
          })
        )
        setInputSlippageTolerance('')
      }

      /* Prevent invalid updates to input value with animation and haptic
       * isZero is intentionally left out here because the user should be able to type "0"
       * without the input shaking (ex. typing 0.x shouldn't shake after typing char)
       */
      if (isInvalidNumber || overMaxTolerance || moreThanOneDecimalSymbol || moreThanTwoDecimals) {
        inputShakeX.value = errorShakeAnimation(inputShakeX)
        await impactAsync()
        return
      }

      setInputSlippageTolerance(value)
      setCustomSlippageTolerance(parsedValue)
    },
    [inputShakeX, setCustomSlippageTolerance, t]
  )

  const onFocusSlippageInput = useCallback((): void => {
    setIsEditingSlippage(true)

    // Clear the input if auto slippage is enabled
    if (autoSlippageEnabled) {
      setAutoSlippageEnabled(false)
      setInputSlippageTolerance('')
    }
  }, [autoSlippageEnabled])

  const onBlurSlippageInput = useCallback(() => {
    setIsEditingSlippage(false)

    // Set autoSlippageEnabled to true if input is invalid (ex. '' or '.')
    if (isNaN(parsedInputSlippageTolerance)) {
      setAutoSlippageEnabled(true)
      setCustomSlippageTolerance(undefined)
      return
    }

    setInputSlippageTolerance(parsedInputSlippageTolerance.toFixed(2))
  }, [parsedInputSlippageTolerance, setCustomSlippageTolerance])

  const onPressPlusMinusButton = useCallback(
    (type: PlusMinusButtonType): void => {
      if (autoSlippageEnabled) {
        setAutoSlippageEnabled(false)
      }

      const newSlippage =
        currentSlippageToleranceNum +
        (type === PlusMinusButtonType.Plus ? SLIPPAGE_INCREMENT : -SLIPPAGE_INCREMENT)
      const constrainedNewSlippage =
        type === PlusMinusButtonType.Plus
          ? Math.min(newSlippage, MAX_CUSTOM_SLIPPAGE_TOLERANCE)
          : Math.max(newSlippage, 0)

      if (constrainedNewSlippage === 0) {
        setInputWarning(t('Enter a value larger than 0'))
      } else {
        setInputWarning(undefined)
      }

      setInputSlippageTolerance(constrainedNewSlippage.toFixed(2).toString())
      setCustomSlippageTolerance(constrainedNewSlippage)
    },
    [autoSlippageEnabled, currentSlippageToleranceNum, setCustomSlippageTolerance, t]
  )

  return (
    <Flex centered gap="$spacing16">
      <Text color="$neutral2" textAlign="center" variant="body2">
        {t('Your transaction will revert if the price changes more than the slippage percentage.')}{' '}
      </Text>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapSlippage} />
      <Flex gap="$spacing12">
        <Flex centered row gap="$spacing16" mt="$spacing12">
          <PlusMinusButton
            disabled={currentSlippageToleranceNum === 0}
            type={PlusMinusButtonType.Minus}
            onPress={onPressPlusMinusButton}
          />
          <AnimatedFlex
            row
            alignItems="center"
            bg={isEditingSlippage ? '$surface2' : '$surface1'}
            borderColor="$surface3"
            borderRadius="$roundedFull"
            borderWidth={1}
            gap="$spacing12"
            p="$spacing16"
            style={inputAnimatedStyle}>
            <TouchableArea hapticFeedback onPress={onPressAutoSlippage}>
              <Text color="$accent1" variant="buttonLabel3">
                {t('Auto')}
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
              value={
                autoSlippageEnabled
                  ? autoSlippageTolerance.toFixed(2).toString()
                  : inputSlippageTolerance
              }
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
            disabled={currentSlippageToleranceNum === MAX_CUSTOM_SLIPPAGE_TOLERANCE}
            type={PlusMinusButtonType.Plus}
            onPress={onPressPlusMinusButton}
          />
        </Flex>
        <BottomLabel
          inputWarning={inputWarning}
          showSlippageWarning={showSlippageWarning}
          slippageTolerance={currentSlippageToleranceNum}
          trade={trade}
        />
      </Flex>
    </Flex>
  )
}

function BottomLabel({
  inputWarning,
  trade,
  slippageTolerance,
  showSlippageWarning,
}: {
  inputWarning?: string
  trade: Trade<Currency, Currency, TradeType> | null
  slippageTolerance: number
  showSlippageWarning: boolean
}): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)

  if (inputWarning) {
    return (
      <Flex centered row gap="$spacing8" height={fonts.body2.lineHeight * 2 + spacing.spacing8}>
        <AlertTriangleIcon
          color={colors.DEP_accentWarning.val}
          height={iconSizes.icon16}
          width={iconSizes.icon16}
        />
        <Text color="$DEP_accentWarning" textAlign="center" variant="body2">
          {inputWarning}
        </Text>
      </Flex>
    )
  }

  return trade ? (
    <Flex centered gap="$spacing8" height={fonts.body2.lineHeight * 2 + spacing.spacing8}>
      <Text color="$neutral2" textAlign="center" variant="body2">
        {trade.tradeType === TradeType.EXACT_INPUT
          ? t('Receive at least {{amount}} {{symbol}}', {
              amount: formatCurrencyAmount({
                value: trade.minimumAmountOut(slippageTolerancePercent),
                type: NumberType.TokenTx,
              }),
              symbol: getSymbolDisplayText(trade.outputAmount.currency.symbol),
            })
          : t('Spend at most {{amount}} {{symbol}}', {
              amount: formatCurrencyAmount({
                value: trade.maximumAmountIn(slippageTolerancePercent),
                type: NumberType.TokenTx,
              }),
              symbol: getSymbolDisplayText(trade.inputAmount.currency.symbol),
            })}
      </Text>
      {showSlippageWarning ? (
        <Flex centered row gap="$spacing8">
          <AlertTriangleIcon
            color={colors.DEP_accentWarning.val}
            height={iconSizes.icon16}
            width={iconSizes.icon16}
          />
          <Text color="$DEP_accentWarning" variant="body2">
            {t('Slippage may be higher than necessary')}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  ) : (
    <Flex height={fonts.body2.lineHeight} />
  )
}
