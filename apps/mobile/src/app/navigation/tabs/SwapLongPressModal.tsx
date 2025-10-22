import { BlurView } from 'expo-blur'
import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { SwapButton } from 'src/app/navigation/tabs/SwapButton'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Bank, Buy, ReceiveAlt, SendAction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { isAndroid } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

const styles = StyleSheet.create({
  blurView: {
    flex: 1,
  },
})
interface SwapLongPressModalProps {
  isVisible: boolean
  onClose: () => void
  onSwapLongPress: () => void
}

export function SwapLongPressModal({ isVisible, onClose, onSwapLongPress }: SwapLongPressModalProps): JSX.Element {
  const colors = useSporeColors()
  const insets = useAppInsets()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const openReceiveModal = useOpenReceiveModal()
  const { isTestnetModeEnabled } = useEnabledChains()
  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)

  const onBuyPress = useEvent(async (): Promise<void> => {
    sendAnalyticsEvent(MobileEventName.SwapLongPress, { element: 'buy' })

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

    onClose()
  })

  const onSellPress = useEvent(() => {
    sendAnalyticsEvent(MobileEventName.SwapLongPress, { element: 'sell' })

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
            initialState: {
              isOfframp: true,
            },
          }),
        )

    onClose()
  })

  const onReceivePress = useEvent(() => {
    sendAnalyticsEvent(MobileEventName.SwapLongPress, { element: 'receive' })

    openReceiveModal()
    onClose()
  })

  const onSendPress = useEvent(() => {
    sendAnalyticsEvent(MobileEventName.SwapLongPress, { element: 'send' })

    dispatch(openModal({ name: ModalName.Send }))
    onClose()
  })

  const swapMenuItems: { title: string; onPress: () => void; icon: ReactNode }[] = useMemo(
    () => [
      {
        title: t('common.button.receive'),
        onPress: onReceivePress,
        icon: <ReceiveAlt size={iconSizes.icon28} color={colors.accent1.val} />,
      },
      {
        title: t('common.button.send'),
        onPress: onSendPress,
        icon: <SendAction size={iconSizes.icon28} color={colors.accent1.val} />,
      },
      {
        title: t('common.button.buy'),
        onPress: onBuyPress,
        icon: <Buy size={iconSizes.icon28} color={colors.accent1.val} />,
      },
      {
        title: t('common.button.sell'),
        onPress: onSellPress,
        icon: <Bank size={iconSizes.icon28} color={colors.accent1.val} />,
      },
    ],
    [t, onReceivePress, onSendPress, onBuyPress, onSellPress, colors.accent1.val],
  )

  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <BlurView
        experimentalBlurMethod={isAndroid ? 'dimezisBlurView' : undefined}
        intensity={90}
        style={styles.blurView}
      >
        <TouchableArea activeOpacity={1} flex={1} justifyContent="flex-end" alignItems="flex-end" onPress={onClose}>
          <Flex
            position="absolute"
            bottom={insets.bottom}
            right={0}
            alignItems="flex-end"
            gap="$spacing16"
            mr="$spacing24"
          >
            {swapMenuItems.map((item) => (
              <MenuItem key={item.title} title={item.title} icon={item.icon} onPress={item.onPress} />
            ))}

            {/* Swap Button as last item in the column */}
            <Flex row height={ESTIMATED_BOTTOM_TABS_HEIGHT} alignItems="center" gap="$spacing24">
              <Text variant="buttonLabel2" color="$neutral1" textAlign="right">
                {t('common.button.swap')}
              </Text>
              <SwapButton onLongPress={onSwapLongPress} onClose={onClose} />
            </Flex>
          </Flex>
        </TouchableArea>
      </BlurView>
    </Modal>
  )
}

function MenuItem({ title, icon, onPress }: { title: string; icon: ReactNode; onPress: () => void }): JSX.Element {
  return (
    <TouchableArea borderRadius="$rounded20" onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing24">
        <Text variant="buttonLabel2" color="$neutral1" textAlign="right">
          {title}
        </Text>
        <Flex
          borderRadius="$roundedFull"
          backgroundColor="$accent2"
          py="$spacing12"
          px="$spacing24"
          borderWidth="$spacing1"
          borderColor="$accent2Hovered"
        >
          {icon}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
