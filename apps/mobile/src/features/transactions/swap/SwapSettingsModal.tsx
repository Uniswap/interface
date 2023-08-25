/* eslint-disable max-lines */
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { AnyAction } from '@reduxjs/toolkit'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { impactAsync } from 'expo-haptics'
import React, { Dispatch, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import PlusMinusButton, { PlusMinusButtonType } from 'src/components/buttons/PlusMinusButton'
import { Switch } from 'src/components/buttons/Switch'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { SwapProtectionInfoModal } from 'src/features/transactions/swap/SwapProtectionModal'
import { slippageToleranceToPercent } from 'src/features/transactions/swap/utils'
import { transactionStateActions } from 'src/features/transactions/transactionState/transactionState'
import { openUri } from 'src/utils/linking'
import { Icons } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import { formatCurrencyAmount, NumberType } from 'utilities/src/format/format'
import {
  MAX_AUTO_SLIPPAGE_TOLERANCE,
  MAX_CUSTOM_SLIPPAGE_TOLERANCE,
} from 'wallet/src/constants/transactions'
import { SWAP_SLIPPAGE_HELP_PAGE_URL } from 'wallet/src/constants/urls'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { useSwapProtectionSetting } from 'wallet/src/features/wallet/hooks'
import { setSwapProtectionSetting, SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { useAppDispatch } from 'wallet/src/state'

const SLIPPAGE_INCREMENT = 0.1

enum SwapSettingsModalView {
  Options,
  Slippage,
}

export type SwapSettingsModalProps = {
  derivedSwapInfo: DerivedSwapInfo
  dispatch: Dispatch<AnyAction>
  onClose?: () => void
}

export default function SwapSettingsModal({
  derivedSwapInfo,
  dispatch,
  onClose,
}: SwapSettingsModalProps): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const [view, setView] = useState(SwapSettingsModalView.Options)

  const { customSlippageTolerance, autoSlippageTolerance } = derivedSwapInfo
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
            isCustomSlippage={isCustomSlippage}
            setView={setView}
            slippage={currentSlippage}
          />
        )
      case SwapSettingsModalView.Slippage:
        return <SlippageSettings derivedSwapInfo={derivedSwapInfo} dispatch={dispatch} />
    }
  }, [currentSlippage, derivedSwapInfo, dispatch, isCustomSlippage, view])

  return (
    <BottomSheetModal
      backgroundColor={theme.colors.surface1}
      name={ModalName.SwapSettings}
      onClose={onClose}>
      <Flex mb="spacing28" px="spacing24" py="spacing12">
        <Flex row justifyContent="space-between">
          <TouchableArea onPress={(): void => setView(SwapSettingsModalView.Options)}>
            <Icons.Chevron
              color={
                view === SwapSettingsModalView.Options ? theme.colors.none : theme.colors.neutral3
              }
              direction="w"
              height={theme.iconSizes.icon24}
              width={theme.iconSizes.icon24}
            />
          </TouchableArea>
          <Text textAlign="center" variant="bodyLarge">
            {getTitle()}
          </Text>
          <Box width={theme.iconSizes.icon24} />
        </Flex>
        {innerContent}
        <Flex centered row>
          <Button fill emphasis={ButtonEmphasis.Secondary} label={t('Close')} onPress={onClose} />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function SwapSettingsOptions({
  slippage,
  isCustomSlippage,
  setView,
}: {
  slippage: number
  isCustomSlippage: boolean
  setView: (newView: SwapSettingsModalView) => void
}): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const isMevBlockerFeatureEnabled = useFeatureFlag(FEATURE_FLAGS.MevBlocker)

  return (
    <Flex fill gap="spacing16" py="spacing12">
      <Flex fill row justifyContent="space-between">
        <Text color="neutral1" variant="subheadSmall">
          {t('Max slippage')}
        </Text>
        <TouchableArea onPress={(): void => setView(SwapSettingsModalView.Slippage)}>
          <Flex row gap="spacing8">
            {!isCustomSlippage ? (
              <Flex centered bg="accent2" borderRadius="roundedFull" px="spacing8">
                <Text color="accent1" variant="buttonLabelMicro">
                  {t('Auto')}
                </Text>
              </Flex>
            ) : null}
            <Text color="neutral2" variant="subheadSmall">{`${slippage
              .toFixed(2)
              .toString()}%`}</Text>
            <Icons.Chevron
              color={theme.colors.neutral3}
              direction="e"
              height={theme.iconSizes.icon24}
              width={theme.iconSizes.icon24}
            />
          </Flex>
        </TouchableArea>
      </Flex>
      {isMevBlockerFeatureEnabled && <SwapProtectionSettingsRow />}
    </Flex>
  )
}

function SwapProtectionSettingsRow(): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
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
  return (
    <>
      {showInfoModal && <SwapProtectionInfoModal onClose={(): void => setShowInfoModal(false)} />}
      <Flex fill gap="spacing16">
        <Flex fill bg="surface3" height={1} />
        <Flex fill row justifyContent="space-between">
          <TouchableArea onPress={(): void => setShowInfoModal(true)}>
            <Flex gap="spacing4">
              <Flex centered row gap="spacing4">
                <Text color="neutral1" variant="subheadSmall">
                  {t('Swap protection')}
                </Text>
                <InfoCircle
                  color={theme.colors.neutral1}
                  height={theme.iconSizes.icon16}
                  width={theme.iconSizes.icon16}
                />
              </Flex>
              <Text color="neutral2" variant="bodyMicro">
                {t('Ethereum Network')}
              </Text>
            </Flex>
          </TouchableArea>
          <Switch
            value={swapProtectionSetting === SwapProtectionSetting.On}
            onValueChange={toggleSwapProtectionSetting}
          />
        </Flex>
      </Flex>
    </>
  )
}

function SlippageSettings({ derivedSwapInfo, dispatch }: SwapSettingsModalProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

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
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShakeX.value }],
  }))

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(SWAP_SLIPPAGE_HELP_PAGE_URL)
  }

  const onPressAutoSlippage = (): void => {
    setAutoSlippageEnabled(true)
    setInputWarning(undefined)
    setInputSlippageTolerance('')
    dispatch(transactionStateActions.setCustomSlippageTolerance(undefined))
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
        inputShakeX.value = withRepeat(
          withTiming(5, { duration: 50, easing: Easing.inOut(Easing.ease) }),
          3,
          true,
          () => {
            inputShakeX.value = 0
          }
        )
        await impactAsync()
        return
      }

      setInputSlippageTolerance(value)
      dispatch(transactionStateActions.setCustomSlippageTolerance(parsedValue))
    },
    [dispatch, inputShakeX, t]
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
      dispatch(transactionStateActions.setCustomSlippageTolerance(undefined))
      return
    }

    setInputSlippageTolerance(parsedInputSlippageTolerance.toFixed(2))
  }, [parsedInputSlippageTolerance, dispatch])

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
      dispatch(transactionStateActions.setCustomSlippageTolerance(constrainedNewSlippage))
    },
    [autoSlippageEnabled, currentSlippageToleranceNum, dispatch, t]
  )

  return (
    <Flex gap="spacing16">
      <Text color="neutral2" textAlign="center" variant="bodySmall">
        {t('Your transaction will revert if the price changes more than the slippage percentage.')}{' '}
        <TouchableArea height={18} onPress={onPressLearnMore}>
          <Text color="accent1" variant="buttonLabelSmall">
            {t('Learn more')}
          </Text>
        </TouchableArea>
      </Text>
      <Flex gap="spacing12">
        <Flex centered row mt="spacing12">
          <PlusMinusButton
            disabled={currentSlippageToleranceNum === 0}
            type={PlusMinusButtonType.Minus}
            onPress={onPressPlusMinusButton}
          />
          <AnimatedFlex
            row
            alignItems="center"
            bg={isEditingSlippage ? 'surface2' : 'surface1'}
            borderColor="surface3"
            borderRadius="roundedFull"
            borderWidth={1}
            gap="spacing12"
            p="spacing16"
            style={inputAnimatedStyle}>
            <TouchableArea hapticFeedback onPress={onPressAutoSlippage}>
              <Text color="accent1" variant="buttonLabelSmall">
                {t('Auto')}
              </Text>
            </TouchableArea>
            <BottomSheetTextInput
              keyboardType="numeric"
              style={{
                color: autoSlippageEnabled ? theme.colors.neutral2 : theme.colors.neutral1,
                fontSize: theme.textVariants.subheadLarge.fontSize,
                fontFamily: theme.textVariants.subheadLarge.fontFamily,
                width: theme.textVariants.subheadLarge.fontSize * 4,
                padding: theme.spacing.none,
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
            <Box width={theme.iconSizes.icon28}>
              <Text color="neutral2" textAlign="center" variant="subheadLarge">
                %
              </Text>
            </Box>
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
  const theme = useAppTheme()
  const { t } = useTranslation()
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)

  if (inputWarning) {
    return (
      <Flex
        centered
        row
        gap="spacing8"
        height={theme.textVariants.bodySmall.lineHeight * 2 + theme.spacing.spacing8}>
        <AlertTriangleIcon
          color={theme.colors.DEP_accentWarning}
          height={theme.iconSizes.icon16}
          width={theme.iconSizes.icon16}
        />
        <Text color="DEP_accentWarning" textAlign="center" variant="bodySmall">
          {inputWarning}
        </Text>
      </Flex>
    )
  }

  return trade ? (
    <Flex
      centered
      gap="spacing8"
      height={theme.textVariants.bodySmall.lineHeight * 2 + theme.spacing.spacing8}>
      <Text color="neutral2" textAlign="center" variant="bodySmall">
        {trade.tradeType === TradeType.EXACT_INPUT
          ? t('Receive at least {{amount}} {{symbol}}', {
              amount: formatCurrencyAmount(
                trade.minimumAmountOut(slippageTolerancePercent),
                NumberType.TokenTx
              ),
              symbol: trade.outputAmount.currency.symbol,
            })
          : t('Spend at most {{amount}} {{symbol}}', {
              amount: formatCurrencyAmount(
                trade.maximumAmountIn(slippageTolerancePercent),
                NumberType.TokenTx
              ),
              symbol: trade.inputAmount.currency.symbol,
            })}
      </Text>
      {showSlippageWarning ? (
        <Flex centered row gap="spacing8">
          <AlertTriangleIcon
            color={theme.colors.DEP_accentWarning}
            height={theme.iconSizes.icon16}
            width={theme.iconSizes.icon16}
          />
          <Text color="DEP_accentWarning" variant="bodySmall">
            {t('Slippage may be higher than necessary')}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  ) : (
    <Box height={theme.textVariants.bodySmall.lineHeight} />
  )
}
