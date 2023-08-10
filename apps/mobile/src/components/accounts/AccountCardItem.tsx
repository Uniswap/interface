import { impactAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { Text } from 'src/components/Text'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { setClipboard } from 'src/utils/clipboard'
import Check from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { useENSAvatar } from 'wallet/src/features/ens/api'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

type AccountCardItemProps = {
  address: Address
  isActive?: boolean
  isViewOnly: boolean
  onPress: (address: Address) => void
} & PortfolioValueProps

type PortfolioValueProps = {
  isPortfolioValueLoading: boolean
  portfolioValue: number | undefined
}

function PortfolioValue({
  isPortfolioValueLoading,
  portfolioValue,
}: PortfolioValueProps): JSX.Element {
  const isLoading = isPortfolioValueLoading && portfolioValue === undefined

  return (
    <Text
      color="neutral2"
      loading={isLoading}
      loadingPlaceholderText="$000.00"
      variant="subheadSmall">
      {formatUSDPrice(portfolioValue, NumberType.PortfolioBalance)}
    </Text>
  )
}

export function AccountCardItem({
  address,
  isViewOnly,
  isActive,
  isPortfolioValueLoading,
  portfolioValue,
  onPress,
}: AccountCardItemProps): JSX.Element {
  const { t } = useTranslation()

  const theme = useAppTheme()
  const displayName = useDisplayName(address)
  const { data: avatar } = useENSAvatar(address)
  const hasNotifications = useSelectAddressHasNotifications(address)
  const dispatch = useAppDispatch()

  const icon = useMemo(() => {
    return (
      <AccountIcon
        address={address}
        avatarUri={avatar}
        showViewOnlyBadge={isViewOnly}
        size={iconSizes.icon40}
      />
    )
  }, [address, avatar, isViewOnly])

  const onPressCopyAddress = async (): Promise<void> => {
    await impactAsync()
    await setClipboard(address)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      })
    )
  }

  const onPressWalletSettings = (): void => {
    dispatch(closeModal({ name: ModalName.AccountSwitcher }))
    navigate(Screens.SettingsStack, {
      screen: Screens.SettingsWallet,
      params: { address },
    })
  }

  const onPressRemoveWallet = (): void => {
    dispatch(closeModal({ name: ModalName.AccountSwitcher }))
    dispatch(
      openModal({
        name: ModalName.RemoveWallet,
        initialState: { address },
      })
    )
  }

  const menuActions = useMemo(() => {
    return [
      { title: t('Copy wallet address'), systemIcon: 'doc.on.doc' },
      { title: t('Wallet settings'), systemIcon: 'gearshape' },
      { title: t('Remove wallet'), systemIcon: 'trash', destructive: true },
    ]
  }, [t])

  return (
    <ContextMenu
      actions={menuActions}
      onPress={async (e): Promise<void> => {
        // Emitted index based on order of menu action array
        // Copy address
        if (e.nativeEvent.index === 0) {
          await onPressCopyAddress()
        }
        // Navigate to settings
        if (e.nativeEvent.index === 1) {
          onPressWalletSettings()
        }
        // Remove wallet
        if (e.nativeEvent.index === 2) {
          onPressRemoveWallet()
        }
      }}>
      <TouchableArea
        hapticFeedback
        pb="spacing12"
        pt="spacing8"
        px="spacing24"
        onPress={(): void => onPress(address)}>
        <Flex row alignItems="center" testID={`account_item/${address}`}>
          <Flex row shrink alignItems="center">
            <NotificationBadge showIndicator={hasNotifications}>{icon}</NotificationBadge>
            <Flex fill gap="none">
              <Text numberOfLines={1} variant="subheadLarge">
                {displayName?.name}
              </Text>
              <PortfolioValue
                isPortfolioValueLoading={isPortfolioValueLoading}
                portfolioValue={portfolioValue}
              />
            </Flex>
          </Flex>
          <Flex row alignItems="center" gap="none">
            {isActive && (
              <Check
                color={theme.colors.accent1}
                height={theme.iconSizes.icon24}
                width={theme.iconSizes.icon24}
              />
            )}
          </Flex>
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
