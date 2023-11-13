import { impactAsync, ImpactFeedbackStyle, selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountIcon } from 'src/components/AccountIcon'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { setClipboard } from 'src/utils/clipboard'
import { isDevBuild } from 'src/utils/version'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { useENSAvatar } from 'wallet/src/features/ens/api'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import {
  selectActiveAccount,
  selectActiveAccountAddress,
} from 'wallet/src/features/wallet/selectors'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

export function AccountHeader(): JSX.Element {
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const account = useAppSelector(selectActiveAccount)
  const dispatch = useAppDispatch()

  const { data: avatar } = useENSAvatar(activeAddress)
  const displayName = useDisplayName(activeAddress)

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

  const walletHasName = displayName?.type !== 'address'
  const iconSize = 52

  return (
    <Flex gap="$spacing12" overflow="scroll" pt="$spacing8" testID="account-header" width="100%">
      {activeAddress && (
        <Flex ai="flex-start" gap="$spacing12" width="100%">
          <Flex row jc="space-between" width="100%">
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
            <TouchableArea hapticFeedback hitSlop={20} onPress={onPressSettings}>
              <Icons.Settings color="$neutral2" opacity={0.8} size="$icon.28" />
            </TouchableArea>
          </Flex>
          {walletHasName ? (
            <Flex row ai="center" gap="$spacing8" justifyContent="space-between">
              <TouchableArea
                hapticFeedback
                flexShrink={1}
                hitSlop={20}
                onPress={onPressAccountHeader}>
                <Text color="$neutral1" flexShrink={1} numberOfLines={1} variant="subheading1">
                  {displayName?.name}
                </Text>
              </TouchableArea>
              <TouchableArea hapticFeedback flexGrow={1} hitSlop={20} onPress={onPressCopyAddress}>
                <Flex row alignItems="center" gap="$spacing4">
                  <Text color="$neutral3" numberOfLines={1} variant="body2">
                    {sanitizeAddressText(shortenAddress(activeAddress))}
                  </Text>
                  <Icons.CopyAlt color="$neutral3" size="$icon.16" />
                </Flex>
              </TouchableArea>
            </Flex>
          ) : (
            <TouchableArea hapticFeedback hitSlop={20} onPress={onPressCopyAddress}>
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
