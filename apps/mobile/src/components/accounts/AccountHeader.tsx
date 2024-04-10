import { impactAsync, ImpactFeedbackStyle, selectionAsync } from 'expo-haptics'
import React, { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { openModal } from 'src/features/modals/modalSlice'
import { setUserProperty } from 'src/features/telemetry'
import { UserPropertyName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { isDevBuild } from 'src/utils/version'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { AnimatedUnitagDisplayName } from 'wallet/src/components/accounts/AnimatedUnitagDisplayName'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useAvatar, useDisplayName } from 'wallet/src/features/wallet/hooks'
import {
  selectActiveAccount,
  selectActiveAccountAddress,
} from 'wallet/src/features/wallet/selectors'
import { DisplayNameType } from 'wallet/src/features/wallet/types'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import { setClipboard } from 'wallet/src/utils/clipboard'

export function AccountHeader(): JSX.Element {
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const account = useAppSelector(selectActiveAccount)
  const dispatch = useAppDispatch()

  const { avatar } = useAvatar(activeAddress)
  const displayName = useDisplayName(activeAddress)

  // Log ENS and Unitag ownership for user usage stats
  useEffect(() => {
    switch (displayName?.type) {
      case DisplayNameType.ENS:
        setUserProperty(UserPropertyName.HasLoadedENS, true)
        return
      case DisplayNameType.Unitag:
        setUserProperty(UserPropertyName.HasLoadedUnitag, true)
        return
      default:
        return
    }
  }, [displayName?.type])

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

  const walletHasName = displayName && displayName?.type !== DisplayNameType.Address
  const iconSize = 52

  return (
    <Flex gap="$spacing12" overflow="scroll" pt="$spacing8" testID="account-header" width="100%">
      {activeAddress && (
        <Flex alignItems="flex-start" gap="$spacing12" width="100%">
          <Flex row justifyContent="space-between" width="100%">
            <TouchableArea
              hapticFeedback
              alignItems="center"
              flexDirection="row"
              hapticStyle={ImpactFeedbackStyle.Medium}
              hitSlop={20}
              testID={ElementName.Manage}
              onLongPress={async (): Promise<void> => {
                if (isDevBuild()) {
                  await selectionAsync()
                  dispatch(openModal({ name: ModalName.Experiments }))
                }
              }}
              onPress={onPressAccountHeader}>
              <AccountIcon
                address={activeAddress}
                avatarUri={avatar}
                showBackground={true}
                showViewOnlyBadge={account?.type === AccountType.Readonly}
                size={iconSize}
              />
            </TouchableArea>
            <TouchableArea
              hapticFeedback
              hitSlop={20}
              testID="account-header/settings-button"
              onPress={onPressSettings}>
              <Icons.Settings color="$neutral2" opacity={0.8} size="$icon.28" />
            </TouchableArea>
          </Flex>
          {walletHasName ? (
            <Flex
              row
              alignItems="center"
              gap="$spacing8"
              justifyContent="space-between"
              testID="account-header/display-name">
              <TouchableArea
                hapticFeedback
                flexShrink={1}
                hitSlop={20}
                onPress={onPressAccountHeader}>
                <AnimatedUnitagDisplayName address={activeAddress} displayName={displayName} />
              </TouchableArea>
            </Flex>
          ) : (
            <TouchableArea
              hapticFeedback
              hitSlop={20}
              testID="account-header/address-only"
              onPress={onPressCopyAddress}>
              <Flex centered row shrink gap="$spacing4">
                <Text
                  adjustsFontSizeToFit
                  color="$neutral1"
                  numberOfLines={1}
                  variant="subheading2">
                  {sanitizeAddressText(shortenAddress(activeAddress))}
                </Text>
                <Icons.CopyAlt color="$neutral1" size="$icon.16" />
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      )}
    </Flex>
  )
}
