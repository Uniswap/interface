import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import Check from 'src/assets/icons/check.svg'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { Text } from 'src/components/Text'
import { useENSAvatar } from 'src/features/ens/api'
import { closeModal } from 'src/features/modals/modalSlice'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType, CopyNotificationType } from 'src/features/notifications/types'
import { ModalName } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { iconSizes } from 'src/styles/sizing'
import { setClipboard } from 'src/utils/clipboard'
import { formatUSDPrice, NumberType } from 'src/utils/format'

type AccountCardItemProps = {
  address: Address
  isActive?: boolean
  isViewOnly: boolean
  onPress: (address: Address) => void
  onPressEdit: (address: Address) => void
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
      color="textTertiary"
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

  const onPressCopyAddress = (): void => {
    setClipboard(address)
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

  const menuActions = useMemo(() => {
    return [
      { title: t('Copy wallet address'), systemIcon: 'doc.on.doc' },
      { title: t('Wallet settings'), systemIcon: 'gearshape' },
    ]
  }, [t])

  return (
    <ContextMenu
      actions={menuActions}
      onPress={(e): void => {
        // Emitted index based on order of menu action array
        // Copy address
        if (e.nativeEvent.index === 0) {
          onPressCopyAddress()
        }
        // Navigate to settings
        if (e.nativeEvent.index === 1) {
          onPressWalletSettings()
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
                color={theme.colors.userThemeMagenta}
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
