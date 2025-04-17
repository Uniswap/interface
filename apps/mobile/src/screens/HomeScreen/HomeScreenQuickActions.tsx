import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowDownCircle, Bank, SendAction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'

/**
 * CTA buttons that appear at top of the screen showing actions such as
 * "Send", "Receive", "Buy" etc.
 */
export function HomeScreenQuickActions(): JSX.Element {
  const colors = useSporeColors()
  const iconSize = iconSizes.icon24
  const contentColor = colors.accent1.val
  const activeScale = 0.96
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { hapticFeedback } = useHapticFeedback()
  const openReceiveModal = useOpenReceiveModal()
  const { isTestnetModeEnabled } = useEnabledChains()
  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)

  const triggerHaptics = useCallback(async () => await hapticFeedback.light(), [hapticFeedback])
  const onPressSend = useCallback(async () => {
    dispatch(openModal({ name: ModalName.Send }))
    await triggerHaptics()
  }, [dispatch, triggerHaptics])

  const onPressReceive = useCallback(async () => {
    openReceiveModal()
    await triggerHaptics()
  }, [openReceiveModal, triggerHaptics])

  const onPressBuy = useCallback(async (): Promise<void> => {
    await triggerHaptics()
    if (isTestnetModeEnabled) {
      navigate(ModalName.TestnetMode, {
        unsupported: true,
        descriptionCopy: t('tdp.noTestnetSupportDescription'),
      })
      return
    }
    disableForKorea
      ? navigate(ModalName.KoreaCexTransferInfoModal)
      : dispatch(
          openModal({
            name: ModalName.FiatOnRampAggregator,
          }),
        )
  }, [triggerHaptics, isTestnetModeEnabled, disableForKorea, dispatch, t])

  // PR #4621 Necessary to declare these as direct dependencies due to race
  // condition with initializing react-i18next and useMemo
  const forLabel = t('home.label.for')
  const sendLabel = t('home.label.send')
  const receiveLabel = t('home.label.receive')
  const actions = useMemo(
    () => [
      {
        Icon: Bank,
        eventName: MobileEventName.FiatOnRampQuickActionButtonPressed,
        label: forLabel,
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
    [onPressBuy, onPressSend, onPressReceive, forLabel, sendLabel, receiveLabel],
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
