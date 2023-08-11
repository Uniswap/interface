import { impactAsync, ImpactFeedbackStyle, selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { setClipboard } from 'src/utils/clipboard'
import { isDevBuild } from 'src/utils/version'
import SettingsIcon from 'ui/src/assets/icons/settings.svg'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

export function AccountHeader(): JSX.Element {
  const theme = useAppTheme()
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
    <Box
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      mt="spacing16"
      testID="account-header">
      <TouchableArea
        hapticFeedback
        alignItems="center"
        flex={1}
        flexDirection="row"
        hapticStyle={ImpactFeedbackStyle.Medium}
        mr="spacing12"
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
          <Flex row alignItems="center" gap="spacing4">
            <Flex shrink>
              <AddressDisplay
                hideAddressInSubtitle
                address={activeAddress}
                horizontalGap="spacing8"
                size={iconSizes.icon28}
                variant="subheadLarge"
              />
            </Flex>
            <Chevron
              color={theme.colors.neutral3}
              direction="s"
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          </Flex>
        )}
      </TouchableArea>
      <TouchableArea hapticFeedback onPress={onPressSettings}>
        <SettingsIcon
          color={theme.colors.neutral2}
          height={theme.iconSizes.icon28}
          opacity="0.8"
          width={theme.iconSizes.icon28}
        />
      </TouchableArea>
    </Box>
  )
}
