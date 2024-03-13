import { getSdkError } from '@walletconnect/utils'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { NetworkLogos } from 'src/components/WalletConnect/NetworkLogos'
import { PendingConnectionSwitchAccountModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchAccountModal'
import { truncateDappName } from 'src/components/WalletConnect/ScanSheet/util'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { getSessionNamespaces } from 'src/features/walletConnect/utils'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import {
  addSession,
  removePendingSession,
  WalletConnectPendingSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { AnimatedFlex, Button, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ChainId } from 'wallet/src/constants/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
  useSignerAccounts,
} from 'wallet/src/features/wallet/hooks'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import {
  WalletConnectEvent,
  WCEventType,
  WCRequestOutcome,
} from 'wallet/src/features/walletConnect/types'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

type Props = {
  pendingSession: WalletConnectPendingSession
  onClose: () => void
}

enum PendingConnectionModalState {
  Hidden,
  SwitchNetwork,
  SwitchAccount,
}

const SitePermissions = (): JSX.Element => {
  const { t } = useTranslation()

  const normalInfoTextSize = 'body2'
  const shortInfoTextSize = 'body3'

  return (
    <Flex
      backgroundColor="$surface2"
      borderTopLeftRadius="$rounded16"
      borderTopRightRadius="$rounded16"
      gap="$spacing12"
      p="$spacing16">
      <Text
        $short={{ variant: 'body3' }}
        allowFontScaling={false}
        color="$neutral2"
        variant="subheading2">
        {t('walletConnect.permissions.title')}
      </Text>
      <Flex centered row gap="$spacing8">
        <Icons.Check color="$statusSuccess" size={iconSizes.icon16} />
        <Text
          $short={{ variant: shortInfoTextSize }}
          allowFontScaling={false}
          color="$neutral1"
          flexGrow={1}
          variant={normalInfoTextSize}>
          {t('walletConnect.permissions.option.viewWalletAddress')}
        </Text>
      </Flex>
      <Flex centered row gap="$spacing8">
        <Icons.Check color="$statusSuccess" size={iconSizes.icon16} />
        <Text
          $short={{ variant: shortInfoTextSize }}
          allowFontScaling={false}
          color="$neutral1"
          flexGrow={1}
          variant={normalInfoTextSize}>
          {t('walletConnect.permissions.option.viewTokenBalances')}
        </Text>
      </Flex>
      <Flex centered row gap="$spacing8">
        <Icons.X color="$statusCritical" size={iconSizes.icon16} />
        <Text
          $short={{ variant: shortInfoTextSize }}
          allowFontScaling={false}
          color="$neutral1"
          flexGrow={1}
          variant={normalInfoTextSize}>
          {t('walletConnect.permissions.option.transferAssets')}
        </Text>
      </Flex>
    </Flex>
  )
}

const NetworksRow = ({ chains }: { chains: ChainId[] }): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex
      row
      shrink
      alignItems="center"
      backgroundColor="$surface2"
      justifyContent="space-between"
      px="$spacing16"
      py="$spacing12">
      <Text
        $short={{ variant: 'body3' }}
        allowFontScaling={false}
        color="$neutral2"
        variant="subheading2">
        {t('walletConnect.permissions.networks')}
      </Text>
      <NetworkLogos chains={chains} />
    </Flex>
  )
}

type SwitchAccountProps = {
  activeAddress: string
  setModalState: (state: PendingConnectionModalState.SwitchAccount) => void
}

const SwitchAccountRow = ({ activeAddress, setModalState }: SwitchAccountProps): JSX.Element => {
  const signerAccounts = useSignerAccounts()
  const accountIsSwitchable = signerAccounts.length > 1

  const onPress = useCallback(() => {
    setModalState(PendingConnectionModalState.SwitchAccount)
  }, [setModalState])

  return (
    <TouchableArea
      backgroundColor="$surface2"
      borderBottomLeftRadius="$rounded16"
      borderBottomRightRadius="$rounded16"
      disabled={!accountIsSwitchable}
      m="$none"
      px="$spacing16"
      py="$spacing12"
      testID={ElementName.WCDappSwitchAccount}
      onPress={onPress}>
      <AccountDetails
        address={activeAddress}
        allowFontScaling={false}
        chevron={accountIsSwitchable}
      />
    </TouchableArea>
  )
}

export const PendingConnectionModal = ({ pendingSession, onClose }: Props): JSX.Element => {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const activeAddress = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const didOpenFromDeepLink = useAppSelector(selectDidOpenFromDeepLink)

  const [modalState, setModalState] = useState<PendingConnectionModalState>(
    PendingConnectionModalState.Hidden
  )

  const onPressSettleConnection = useCallback(
    async (approved: boolean) => {
      sendMobileAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
        request_type: WCEventType.SessionPending,
        dapp_url: pendingSession.dapp.url,
        dapp_name: pendingSession.dapp.name,
        wc_version: '2',
        connection_chain_ids: pendingSession.chains,
        outcome: approved ? WCRequestOutcome.Confirm : WCRequestOutcome.Reject,
      })

      // Handle WC 2.0 session request
      if (approved) {
        const namespaces = getSessionNamespaces(activeAddress, pendingSession.proposalNamespaces)

        const session = await wcWeb3Wallet.approveSession({
          id: Number(pendingSession.id),
          namespaces,
        })

        dispatch(
          addSession({
            wcSession: {
              id: session.topic,
              dapp: {
                name: session.peer.metadata.name,
                url: session.peer.metadata.url,
                icon: session.peer.metadata.icons[0] ?? null,
                source: 'walletconnect',
              },
              chains: pendingSession.chains,
              namespaces,
            },
            account: activeAddress,
          })
        )

        dispatch(
          pushNotification({
            type: AppNotificationType.WalletConnect,
            address: activeAddress,
            event: WalletConnectEvent.Connected,
            dappName: session.peer.metadata.name,
            imageUrl: session.peer.metadata.icons[0] ?? null,
            hideDelay: 3 * ONE_SECOND_MS,
          })
        )
      } else {
        await wcWeb3Wallet.rejectSession({
          id: Number(pendingSession.id),
          reason: getSdkError('USER_REJECTED'),
        })
        dispatch(removePendingSession())
      }

      onClose()
      if (didOpenFromDeepLink) {
        returnToPreviousApp()
      }
    },
    [activeAddress, dispatch, onClose, pendingSession, didOpenFromDeepLink]
  )
  const dappName = pendingSession.dapp.name || pendingSession.dapp.url || ''

  return (
    <BottomSheetModal name={ModalName.WCPendingConnection} onClose={onClose}>
      <AnimatedFlex
        backgroundColor="$surface1"
        borderRadius="$rounded12"
        gap="$spacing16"
        overflow="hidden"
        pb="$spacing12"
        pt="$spacing32">
        <Flex alignItems="center" gap="$spacing16" justifyContent="flex-end">
          <DappHeaderIcon dapp={pendingSession.dapp} />
          <Text
            $short={{ variant: 'subheading2' }}
            allowFontScaling={false}
            fontWeight="bold"
            px="$spacing24"
            textAlign="center"
            variant="heading3">
            {t('walletConnect.pending.title', {
              dappName: truncateDappName(dappName),
            })}{' '}
          </Text>
          <LinkButton
            backgroundColor="$surface2"
            borderRadius="$rounded16"
            color={colors.accent1.val}
            iconColor={colors.accent1.val}
            label={pendingSession.dapp.url}
            mb="$spacing12"
            px="$spacing8"
            py="$spacing4"
            size={iconSizes.icon12}
            textVariant="buttonLabel4"
            url={pendingSession.dapp.url}
          />
        </Flex>
        <Flex gap="$spacing1" px="$spacing24">
          <SitePermissions />
          <NetworksRow chains={pendingSession.chains} />
          <SwitchAccountRow activeAddress={activeAddress} setModalState={setModalState} />
        </Flex>
        <Flex flexDirection="row" gap="$spacing8" justifyContent="space-between" px="$spacing24">
          <Button
            fill
            testID="cancel-pending-connection"
            theme="secondary"
            onPress={(): Promise<void> => onPressSettleConnection(false)}>
            {t('common.button.cancel')}
          </Button>
          <Button
            fill
            testID="connect-pending-connection"
            onPress={(): Promise<void> => onPressSettleConnection(true)}>
            {t('walletConnect.pending.button.connect')}
          </Button>
        </Flex>
      </AnimatedFlex>
      {modalState === PendingConnectionModalState.SwitchAccount && (
        <PendingConnectionSwitchAccountModal
          activeAccount={activeAccount}
          onClose={(): void => setModalState(PendingConnectionModalState.Hidden)}
          onPressAccount={(account): void => {
            dispatch(setAccountAsActive(account.address))
            setModalState(PendingConnectionModalState.Hidden)
          }}
        />
      )}
    </BottomSheetModal>
  )
}
