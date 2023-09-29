import { getSdkError } from '@walletconnect/utils'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
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
import { AnimatedFlex, Button, Flex, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import Checkmark from 'ui/src/assets/icons/check.svg'
import X from 'ui/src/assets/icons/x.svg'
import { iconSizes } from 'ui/src/theme'
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
  const colors = useSporeColors()
  const { t } = useTranslation()

  const normalInfoTextSize = 'body2'
  const shortInfoTextSize = 'body3'

  return (
    <Flex gap="$spacing12" px="$spacing16" py="$spacing8">
      <Text $short={{ variant: 'body3' }} color="$neutral2" variant="subheading2">
        {t('App permissions')}
      </Text>
      <Flex row alignItems="flex-start" gap="$spacing8">
        <Flex mt="$spacing2">
          <Checkmark
            color={colors.statusSuccess.val}
            height={iconSizes.icon16}
            width={iconSizes.icon16}
          />
        </Flex>
        <Flex fill>
          <Text
            $short={{ variant: shortInfoTextSize }}
            color="$neutral1"
            variant={normalInfoTextSize}>
            {t('View your wallet address')}
          </Text>
        </Flex>
      </Flex>
      <Flex row alignItems="flex-start" gap="$spacing8">
        <Flex mt="$spacing2">
          <Checkmark
            color={colors.statusSuccess.val}
            height={iconSizes.icon16}
            width={iconSizes.icon16}
          />
        </Flex>
        <Flex fill>
          <Text
            $short={{ variant: shortInfoTextSize }}
            color="$neutral1"
            variant={normalInfoTextSize}>
            {t('View your token balances')}
          </Text>
        </Flex>
      </Flex>
      <Flex row alignItems="flex-start" gap="$spacing8">
        <Flex mt="$spacing2">
          <X color={colors.statusCritical.val} height={iconSizes.icon16} width={iconSizes.icon16} />
        </Flex>
        <Flex fill>
          <Text
            $short={{ variant: shortInfoTextSize }}
            color="$neutral1"
            variant={normalInfoTextSize}>
            {t('Transfer your assets without consent')}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

const NetworksRow = ({ chains }: { chains: ChainId[] }): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex row shrink alignItems="center" justifyContent="space-between" px="$spacing12">
      <Flex grow row justifyContent="space-between">
        <Text color="$neutral1" variant="subheading2">
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
      m="$none"
      p="$spacing12"
      testID={ElementName.WCDappSwitchAccount}
      onPress={onPress}>
      <AccountDetails address={activeAddress} chevron={accountIsSwitchable} />
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
        fill
        backgroundColor="$surface1"
        borderRadius="$rounded12"
        overflow="hidden"
        px="$spacing24"
        py="$spacing24">
        <Flex fill alignItems="center" gap="$spacing16" justifyContent="flex-end">
          <DappHeaderIcon dapp={pendingSession.dapp} />
          <Text
            $short={{ variant: 'subheading2' }}
            fontWeight="bold"
            textAlign="center"
            variant="heading3">
            {t('{{ dappName }} wants to connect to your wallet', {
              dappName: truncateDappName(dappName),
            })}{' '}
          </Text>
          <LinkButton
            backgroundColor="$surface2"
            borderRadius="$rounded16"
            color={colors.accent1.get()}
            iconColor={colors.accent1.get()}
            label={pendingSession.dapp.url}
            mb="$spacing12"
            px="$spacing8"
            py="$spacing4"
            size={iconSizes.icon12}
            textVariant="buttonLabel4"
            url={pendingSession.dapp.url}
          />
        </Flex>
        <Flex bg="$surface2" borderRadius="$rounded16" gap="$spacing2">
          <SitePermissions />
          <Separator borderColor="$surface1" width={1} />
          <NetworksRow chains={pendingSession.chains} />
          <Separator borderColor="$surface1" width={1} />
          <SwitchAccountRow activeAddress={activeAddress} setModalState={setModalState} />
          <Flex />
        </Flex>
        <Flex flexDirection="row" gap="$spacing8" justifyContent="space-between">
          <Button
            fill
            testID="cancel-pending-connection"
            theme="secondary"
            onPress={(): Promise<void> => onPressSettleConnection(false)}>
            {t('Cancel')}
          </Button>
          <Button
            fill
            testID="connect-pending-connection"
            onPress={(): Promise<void> => onPressSettleConnection(true)}>
            {t('Connect')}
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
