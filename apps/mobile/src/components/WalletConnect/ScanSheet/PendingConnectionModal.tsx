import { getSdkError } from '@walletconnect/utils'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { NetworkLogos } from 'src/components/WalletConnect/NetworkLogos'
import { PendingConnectionSwitchAccountModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchAccountModal'
import { truncateDappName } from 'src/components/WalletConnect/ScanSheet/util'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName, ModalName } from 'src/features/telemetry/constants'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { getSessionNamespaces } from 'src/features/walletConnect/utils'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import {
  addSession,
  removePendingSession,
  WalletConnectPendingSession,
} from 'src/features/walletConnect/walletConnectSlice'
import Checkmark from 'ui/src/assets/icons/check.svg'
import X from 'ui/src/assets/icons/x.svg'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
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
  const theme = useAppTheme()
  const { t } = useTranslation()

  return (
    <Flex gap="spacing12" p="spacing16">
      <Text color="neutral2" variant="subheadSmall">
        {t('App permissions')}
      </Text>
      <Flex row alignItems="flex-start" gap="spacing8">
        <Box mt="spacing2">
          <Checkmark color={theme.colors.statusSuccess} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="neutral1" variant="bodySmall">
            {t('View your wallet address')}
          </Text>
        </Box>
      </Flex>
      <Flex row alignItems="flex-start" gap="spacing8">
        <Box mt="spacing2">
          <Checkmark color={theme.colors.statusSuccess} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="neutral1" variant="bodySmall">
            {t('View your token balances')}
          </Text>
        </Box>
      </Flex>
      <Flex row alignItems="flex-start" gap="spacing8">
        <Box mt="spacing2">
          <X color={theme.colors.statusCritical} height={16} width={16} />
        </Box>
        <Box flex={1}>
          <Text color="neutral1" variant="bodySmall">
            {t('Transfer your assets without consent')}
          </Text>
        </Box>
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
      gap="spacing12"
      justifyContent="space-between"
      p="spacing12">
      <Flex grow row gap="spacing8" justifyContent="space-between">
        <Text color="neutral1" variant="subheadSmall">
          {t('Networks')}
        </Text>
        <NetworkLogos chains={chains} />
      </Flex>
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
      disabled={!accountIsSwitchable}
      m="none"
      p="spacing12"
      testID={ElementName.WCDappSwitchAccount}
      onPress={onPress}>
      <AccountDetails address={activeAddress} chevron={accountIsSwitchable} />
    </TouchableArea>
  )
}

export const PendingConnectionModal = ({ pendingSession, onClose }: Props): JSX.Element => {
  const { t } = useTranslation()
  const theme = useAppTheme()
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
  const dappName = pendingSession.dapp.name || pendingSession.dapp.url

  return (
    <BottomSheetModal name={ModalName.WCPendingConnection} onClose={onClose}>
      <AnimatedFlex
        backgroundColor="surface2"
        borderRadius="rounded12"
        flex={1}
        gap="spacing24"
        overflow="hidden"
        px="spacing24"
        py="spacing60">
        <Flex alignItems="center" flex={1} gap="spacing16" justifyContent="flex-end">
          <DappHeaderIcon dapp={pendingSession.dapp} />
          <Text fontWeight="bold" textAlign="center" variant="headlineSmall">
            {t('{{ dappName }} wants to connect to your wallet', {
              dappName: truncateDappName(dappName),
            })}{' '}
          </Text>
          <LinkButton
            backgroundColor="surface2"
            borderRadius="rounded16"
            color={theme.colors.accent1}
            iconColor={theme.colors.accent1}
            label={pendingSession.dapp.url}
            mb="spacing12"
            px="spacing8"
            py="spacing4"
            size={theme.iconSizes.icon12}
            textVariant="buttonLabelMicro"
            url={pendingSession.dapp.url}
          />
        </Flex>
        <Flex bg="surface2" borderRadius="rounded16" gap="spacing2">
          <SitePermissions />
          <Separator color="surface2" width={1} />
          <NetworksRow chains={pendingSession.chains} />
          <Separator color="surface2" width={1} />
          <SwitchAccountRow activeAddress={activeAddress} setModalState={setModalState} />
          <Box />
        </Flex>
        <Flex flexDirection="row" gap="spacing8" justifyContent="space-between">
          <Button
            fill
            emphasis={ButtonEmphasis.Secondary}
            label={t('Cancel')}
            onPress={(): Promise<void> => onPressSettleConnection(false)}
          />
          <Button
            fill
            label={t('Connect')}
            onPress={(): Promise<void> => onPressSettleConnection(true)}
          />
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
