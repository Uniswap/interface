import { impactAsync, ImpactFeedbackStyle, selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { setClipboard } from 'src/utils/clipboard'
import { isDevBuild } from 'src/utils/version'
import { Flex, Icons, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

export function AccountHeader(): JSX.Element {
  const colors = useSporeColors()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const dispatch = useAppDispatch()

  const onPressAccountHeader = useCallback(() => {
    dispatch(openModal({ name: ModalName.AccountSwitcher }))
  }, [dispatch])

  const onPressSettings = (): void => {
    navigate(Screens.SettingsStack, { screen: Screens.Settings })
  }

  const onPressCopyAddress = async (): Promise<void> => {
    if (activeAddress) {
      await impactAsync()
      await setClipboard(activeAddress)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.Address,
        })
      )
    }
  }

  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      mt="$spacing16"
      testID="account-header">
      <TouchableArea
        hapticFeedback
        alignItems="center"
        flex={1}
        flexDirection="row"
        hapticStyle={ImpactFeedbackStyle.Medium}
        mr="$spacing12"
        testID={ElementName.Manage}
        onLongPress={async (): Promise<void> => {
          await onPressCopyAddress()
          if (isDevBuild()) {
            await selectionAsync()
            dispatch(openModal({ name: ModalName.Experiments }))
          }
        }}
        onPress={onPressAccountHeader}>
        {activeAddress && (
          <Flex row alignItems="center" gap="$spacing4">
            <Flex shrink>
              <AddressDisplay
                hideAddressInSubtitle
                address={activeAddress}
                horizontalGap="$spacing8"
                size={iconSizes.icon28}
                variant="subheading1"
              />
            </Flex>
            <Icons.RotatableChevron
              color="$neutral3"
              direction="s"
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          </Flex>
        )}
      </TouchableArea>
      <TouchableArea hapticFeedback onPress={onPressSettings}>
        <Icons.Settings
          color={colors.neutral2.val}
          height={iconSizes.icon28}
          opacity="0.8"
          width={iconSizes.icon28}
        />
      </TouchableArea>
    </Flex>
  )
}
