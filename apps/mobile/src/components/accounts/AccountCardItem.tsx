import { impactAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Text } from 'src/components/Text'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { setClipboard } from 'src/utils/clipboard'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'

type AccountCardItemProps = {
  address: Address
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
        <Flex row alignItems="flex-start" testID={`account_item/${address}`}>
          <Flex fill gap="$none">
            <AddressDisplay
              address={address}
              captionVariant="bodyMicro"
              gapBetweenLines="$spacing2"
              showViewOnlyBadge={isViewOnly}
              size={iconSizes.icon36}
            />
          </Flex>
          <PortfolioValue
            isPortfolioValueLoading={isPortfolioValueLoading}
            portfolioValue={portfolioValue}
          />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
