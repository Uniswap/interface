import { impactAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { Screens } from 'src/screens/Screens'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useAccountList } from 'wallet/src/features/accounts/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { ModalName } from 'wallet/src/telemetry/constants'
import { setClipboard } from 'wallet/src/utils/clipboard'

type AccountCardItemProps = {
  address: Address
  isViewOnly: boolean
  onPress: (address: Address) => void
} & PortfolioValueProps

type PortfolioValueProps = {
  address: Address
  isPortfolioValueLoading: boolean
  portfolioValue: number | undefined
}

function PortfolioValue({
  address,
  isPortfolioValueLoading,
  portfolioValue: providedPortfolioValue,
}: PortfolioValueProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // When we add a new wallet, we'll make a new network request to fetch all accounts as a single request.
  // Since we're adding a new wallet address to the `ownerAddresses` array, this will be a brand new query, which won't be cached.
  // To avoid all wallets showing a "loading" state, we read directly from cache while we wait for the other query to complete.

  const { data } = useAccountList({
    fetchPolicy: 'cache-first',
    addresses: address,
  })

  const cachedPortfolioValue = data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value

  const portfolioValue = providedPortfolioValue ?? cachedPortfolioValue

  const isLoading = isPortfolioValueLoading && portfolioValue === undefined

  return (
    <Text color="$neutral2" loading={isLoading} variant="subheading2">
      {portfolioValue === undefined
        ? t('common.text.notAvailable')
        : convertFiatAmountFormatted(portfolioValue, NumberType.PortfolioBalance)}
    </Text>
  )
}

export function AccountCardItem({
  address,
  isViewOnly,
  isPortfolioValueLoading,
  portfolioValue,
  onPress,
}: AccountCardItemProps): JSX.Element {
  const { t } = useTranslation()

  const dispatch = useAppDispatch()

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
    dispatch(openModal({ name: ModalName.RemoveWallet, initialState: { address } }))
  }

  const menuActions = useMemo(() => {
    return [
      { title: t('account.wallet.action.copy'), systemIcon: 'doc.on.doc' },
      { title: t('account.wallet.action.settings'), systemIcon: 'gearshape' },
      { title: t('account.wallet.button.remove'), systemIcon: 'trash', destructive: true },
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
        pb="$spacing12"
        pt="$spacing8"
        px="$spacing24"
        onLongPress={disableOnPress}
        onPress={(): void => onPress(address)}>
        <Flex row alignItems="flex-start" gap="$spacing16" testID={`account-item/${address}`}>
          <Flex fill>
            <AddressDisplay
              address={address}
              captionVariant="body3"
              gapBetweenLines="$spacing2"
              notificationsBadgeContainer={NotificationsBadgeContainer}
              showViewOnlyBadge={isViewOnly}
              size={iconSizes.icon36}
            />
          </Flex>
          <PortfolioValue
            address={address}
            isPortfolioValueLoading={isPortfolioValueLoading}
            portfolioValue={portfolioValue}
          />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}

const NotificationsBadgeContainer = ({
  children,
  address,
}: {
  children: React.ReactNode
  address: string
}): JSX.Element => <NotificationBadge address={address}>{children}</NotificationBadge>
