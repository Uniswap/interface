import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { openModal } from 'src/features/modals/modalSlice'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { Flex, GeneratedIcon, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowDownCircle, Bank, Buy, SendAction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType, MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

export type QuickAction = {
  /* Icon to display for the action */
  Icon: GeneratedIcon
  /* Event name to log when the action is triggered */
  eventName?: MobileEventName
  /* Label to display for the action */
  label: string
  /* Name of the element to log when the action is triggered */
  name: ElementNameType
  /* Callback to execute when the action is triggered */
  onPress: () => void
}

/**
 * CTA buttons that appear at top of the screen showing actions such as
 * "Send", "Receive", "Buy" etc.
 */
export function HomeScreenQuickActions({ onPressBuy }: { onPressBuy: () => void }): JSX.Element {
  const colors = useSporeColors()
  const iconSize = iconSizes.icon24
  const contentColor = colors.accent1.val
  const activeScale = 0.96
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { hapticFeedback } = useHapticFeedback()
  const cexTransferProviders = useCexTransferProviders()

  const isOffRampEnabled = useFeatureFlag(FeatureFlags.FiatOffRamp)

  const triggerHaptics = useCallback(async () => await hapticFeedback.light(), [hapticFeedback])
  const onPressSend = useCallback(async () => {
    dispatch(openModal({ name: ModalName.Send }))
    await triggerHaptics()
  }, [dispatch, triggerHaptics])

  const onPressReceive = useCallback(async () => {
    dispatch(
      openModal(
        cexTransferProviders.length > 0
          ? { name: ModalName.ReceiveCryptoModal, initialState: cexTransferProviders }
          : { name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr },
      ),
    )
    await triggerHaptics()
  }, [dispatch, cexTransferProviders, triggerHaptics])

  // PR #4621 Necessary to declare these as direct dependencies due to race
  // condition with initializing react-i18next and useMemo
  const buyLabel = t('home.label.buy')
  const forLabel = t('home.label.for')
  const sendLabel = t('home.label.send')
  const receiveLabel = t('home.label.receive')
  const actions = useMemo(
    () => [
      {
        Icon: isOffRampEnabled ? Bank : Buy,
        eventName: MobileEventName.FiatOnRampQuickActionButtonPressed,
        label: isOffRampEnabled ? forLabel : buyLabel,
        name: ElementName.Buy,
        onPress: onPressBuy,
      },
      {
        Icon: SendAction,
        label: sendLabel,
        name: ElementName.Send,
        onPress: onPressSend,
      },
      {
        Icon: ArrowDownCircle,
        label: receiveLabel,
        name: ElementName.Receive,
        onPress: onPressReceive,
      },
    ],
    [isOffRampEnabled, onPressBuy, onPressSend, onPressReceive, buyLabel, forLabel, sendLabel, receiveLabel],
  )

  return (
    <Flex centered row gap="$spacing8" px="$spacing12">
      {actions.map(({ eventName, name, label, Icon, onPress }) => (
        <Trace key={name} logPress element={name} eventOnTrigger={eventName}>
          <TouchableArea flex={1} scaleTo={activeScale} onPress={onPress}>
            <Flex
              fill
              backgroundColor="$accent2"
              borderRadius="$rounded20"
              py="$spacing16"
              px="$spacing12"
              gap="$spacing12"
              justifyContent="space-between"
            >
              <Icon color={contentColor} size={iconSize} strokeWidth={2} />
              <Text color={contentColor} variant="buttonLabel2">
                {label}
              </Text>
            </Flex>
          </TouchableArea>
        </Trace>
      ))}
    </Flex>
  )
}
