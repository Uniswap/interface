import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { MODAL_OPEN_WAIT_TIME } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/rootNavigation'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { NumberType } from 'utilities/src/format/types'
import { noop } from 'utilities/src/react/noop'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

type AccountCardItemProps = {
  address: Address
  isViewOnly: boolean
  onPress: (address: Address) => void
  onClose: () => void
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

  const { data } = useAccountListData({
    fetchPolicy: 'cache-first',
    addresses: [address],
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
  onClose,
}: AccountCardItemProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { defaultChainId } = useEnabledChains()
  const ensName = useENS({ nameOrAddress: address, chainId: defaultChainId }).name
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })

  const addressToAccount = useAccounts()
  const selectedAccount = addressToAccount[address]

  const onlyLabeledWallet = ensName === null && unitag?.username === undefined

  const onPressCopyAddress = useCallback(async (): Promise<void> => {
    await setClipboard(address)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CopyAddress,
      modal: ModalName.AccountSwitcher,
    })
  }, [address, dispatch])

  const onPressEditWalletSettings = useCallback(() => {
    onClose()

    if (selectedAccount?.type === AccountType.SignerMnemonic && !onlyLabeledWallet) {
      navigate(ModalName.EditProfileSettingsModal, {
        address,
        accessPoint: UnitagScreens.UnitagConfirmation,
      })
    } else {
      navigate(ModalName.EditLabelSettingsModal, {
        address,
        accessPoint: UnitagScreens.UnitagConfirmation,
      })
    }
  }, [selectedAccount?.type, onlyLabeledWallet, address, onClose])

  const onPressConnectionSettings = useCallback(() => {
    onClose()

    //Wait 300ms to open the the connection Modal and avoid overlapping animation
    setTimeout(() => {
      navigate(ModalName.ConnectionsDappListModal, {
        address,
      })
    }, MODAL_OPEN_WAIT_TIME)
  }, [address, onClose])

  const onPressRemoveWallet = useCallback(() => {
    onClose()
    navigate(ModalName.RemoveWallet, { address })
  }, [address, onClose])

  const menuActions = useMemo(
    () => [
      {
        title: t('account.wallet.action.copy'),
        systemIcon: 'doc.on.doc',
        onPress: onPressCopyAddress,
      },
      ...(selectedAccount?.type === AccountType.Readonly
        ? [
            {
              title: t('settings.setting.wallet.action.editLabel'),
              systemIcon: 'square.and.pencil',
              onPress: onPressEditWalletSettings,
            },
          ]
        : []),

      ...(selectedAccount?.type === AccountType.Readonly
        ? [
            {
              title: t('account.wallet.button.remove'),
              systemIcon: 'trash',
              destructive: true,
              onPress: onPressRemoveWallet,
            },
          ]
        : []),

      ...(selectedAccount?.type === AccountType.SignerMnemonic
        ? [
            {
              title: onlyLabeledWallet
                ? t('settings.setting.wallet.action.editLabel')
                : t('settings.setting.wallet.action.editProfile'),
              systemIcon: 'square.and.pencil',
              onPress: onPressEditWalletSettings,
            },
            {
              title: t('account.wallet.action.manageConnections'),
              systemIcon: 'globe',
              onPress: onPressConnectionSettings,
            },
            {
              title: t('account.wallet.button.remove'),
              systemIcon: 'trash',
              destructive: true,
              onPress: onPressRemoveWallet,
            },
          ]
        : []),
    ],
    [
      t,
      selectedAccount,
      onlyLabeledWallet,
      onPressCopyAddress,
      onPressEditWalletSettings,
      onPressConnectionSettings,
      onPressRemoveWallet,
    ],
  )

  return (
    <ContextMenu
      actions={menuActions}
      onPress={async (e): Promise<void> => {
        await menuActions[e.nativeEvent.index]?.onPress?.()
      }}
    >
      <TouchableArea
        pb="$spacing12"
        pt="$spacing8"
        px="$spacing24"
        onLongPress={noop}
        onPress={(): void => onPress(address)}
      >
        <Flex row alignItems="flex-start" gap="$spacing16" testID={`account-item/${address}`}>
          <Flex fill>
            <AddressDisplay
              address={address}
              captionVariant="body3"
              gapBetweenLines="$spacing2"
              notificationsBadgeContainer={NotificationsBadgeContainer}
              showViewOnlyBadge={isViewOnly}
              size={iconSizes.icon32}
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
