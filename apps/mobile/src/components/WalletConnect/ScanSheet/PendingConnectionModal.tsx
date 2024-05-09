import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { getSdkError } from '@walletconnect/utils'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { ModalWithOverlay } from 'src/components/WalletConnect/ModalWithOverlay/ModalWithOverlay'
import { PendingConnectionSwitchAccountModal } from 'src/components/WalletConnect/ScanSheet/PendingConnectionSwitchAccountModal'
import { truncateQueryParams } from 'src/components/WalletConnect/ScanSheet/util'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { getSessionNamespaces } from 'src/features/walletConnect/utils'
import {
  WalletConnectPendingSession,
  addSession,
  removePendingSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Check, X } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
import { NetworkLogos } from 'wallet/src/components/network/NetworkLogos'
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
  WCEventType,
  WCRequestOutcome,
  WalletConnectEvent,
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

  const infoTextSize = 'body3'

  return (
    <Flex
      borderColor="$surface3"
      borderTopLeftRadius="$rounded16"
      borderTopRightRadius="$rounded16"
      borderWidth={1}
      minHeight={44}
      p="$spacing12">
      <Flex centered row justifyContent="space-between">
        <Text
          $short={{ variant: 'body3' }}
          allowFontScaling={false}
          color="$neutral2"
          variant="body3">
          {t('walletConnect.permissions.title')}
        </Text>
      </Flex>
      <Flex gap="$spacing8" pt="$spacing12">
        <Flex centered row gap="$spacing4">
          <Check color="$statusSuccess" size={iconSizes.icon16} />
          <Text
            $short={{ variant: infoTextSize }}
            allowFontScaling={false}
            color="$neutral1"
            flexGrow={1}
            variant={infoTextSize}>
            {t('walletConnect.permissions.option.viewWalletAddress')}
          </Text>
        </Flex>
        <Flex centered row gap="$spacing4">
          <Check color="$statusSuccess" size={iconSizes.icon16} />
          <Text
            $short={{ variant: infoTextSize }}
            allowFontScaling={false}
            color="$neutral1"
            flexGrow={1}
            variant={infoTextSize}>
            {t('walletConnect.permissions.option.viewTokenBalances')}
          </Text>
        </Flex>
        <Flex centered row gap="$spacing4">
          <X color="$statusCritical" size={iconSizes.icon16} />
          <Text
            $short={{ variant: infoTextSize }}
            allowFontScaling={false}
            color="$neutral1"
            flexGrow={1}
            variant={infoTextSize}>
            {t('walletConnect.permissions.option.transferAssets')}
          </Text>
        </Flex>
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
      borderColor="$surface3"
      borderEndWidth={1}
      borderStartWidth={1}
      height="$spacing48"
      justifyContent="space-between"
      px="$spacing12"
      py="$spacing12">
      <Text
        $short={{ variant: 'body3' }}
        allowFontScaling={false}
        color="$neutral2"
        variant="body3">
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
      borderBottomLeftRadius="$rounded16"
      borderBottomRightRadius="$rounded16"
      borderColor="$surface3"
      borderWidth={1}
      disabled={!accountIsSwitchable}
      height="$spacing48"
      m="$none"
      px="$spacing12"
      py="$spacing12"
      testID={ElementName.WCDappSwitchAccount}
      onPress={onPress}>
      <AccountDetails
        address={activeAddress}
        allowFontScaling={false}
        chevron={accountIsSwitchable}
        chevronColor="$neutral3"
      />
    </TouchableArea>
  )
}

export const PendingConnectionModal = ({ pendingSession, onClose }: Props): JSX.Element => {
  const { t } = useTranslation()

  const dispatch = useAppDispatch()
  const activeAddress = useActiveAccountAddressWithThrow()
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
    <>
      <ModalWithOverlay
        confirmationButtonText={t('walletConnect.pending.button.connect')}
        name={ModalName.WCPendingConnection}
        scrollDownButtonText={t('walletConnect.pending.button.scrollDown')}
        onClose={onClose}
        onConfirm={(): Promise<void> => onPressSettleConnection(true)}
        onReject={(): Promise<void> => onPressSettleConnection(false)}>
        <PendingConnectionModalContent
          activeAddress={activeAddress}
          dappName={dappName}
          pendingSession={pendingSession}
          setModalState={setModalState}
        />
      </ModalWithOverlay>

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
    </>
  )
}

type PendingConnectionModalContentProps = {
  activeAddress: string
  dappName: string
  pendingSession: WalletConnectPendingSession
  setModalState: (state: PendingConnectionModalState.SwitchAccount) => void
}

function PendingConnectionModalContent({
  activeAddress,
  dappName,
  pendingSession,
  setModalState,
}: PendingConnectionModalContentProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const { animatedFooterHeight } = useBottomSheetInternal()

  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value,
  }))

  return (
    <>
      <Flex alignItems="center" gap="$spacing16" justifyContent="flex-end">
        <DappHeaderIcon dapp={pendingSession.dapp} />
        <Text
          $short={{ variant: 'subheading2' }}
          allowFontScaling={false}
          fontWeight="bold"
          textAlign="center"
          variant="heading3">
          {t('walletConnect.pending.title', {
            dappName,
          })}{' '}
        </Text>
        <LinkButton
          backgroundColor="$surface2"
          borderRadius="$rounded16"
          color={colors.accent1.val}
          iconColor={colors.accent1.val}
          label={truncateQueryParams(pendingSession.dapp.url)}
          mb="$spacing12"
          px="$spacing8"
          py="$spacing4"
          size={iconSizes.icon12}
          textVariant="buttonLabel4"
          url={pendingSession.dapp.url}
        />
      </Flex>
      <Flex gap="$spacing1">
        <SitePermissions />
        <NetworksRow chains={pendingSession.chains} />
        <SwitchAccountRow activeAddress={activeAddress} setModalState={setModalState} />
      </Flex>
      <Animated.View style={bottomSpacerStyle} />
    </>
  )
}
