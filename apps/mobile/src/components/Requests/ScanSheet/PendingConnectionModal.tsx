import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { getSdkError } from '@walletconnect/utils'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { DappHeaderIcon } from 'src/components/Requests/DappHeaderIcon'
import { ModalWithOverlay } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { PendingConnectionSwitchAccountModal } from 'src/components/Requests/ScanSheet/PendingConnectionSwitchAccountModal'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { getSessionNamespaces } from 'src/features/walletConnect/utils'
import {
  WalletConnectPendingSession,
  addSession,
  removePendingSession,
  setDidOpenFromDeepLink,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Check, RotatableChevron, X } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { WCEventType, WCRequestOutcome, WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { formatDappURL } from 'utilities/src/format/urls'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
  useSignerAccounts,
} from 'wallet/src/features/wallet/hooks'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'

type Props = {
  pendingSession: WalletConnectPendingSession
  onClose: () => void
}

enum PendingConnectionModalState {
  Hidden = 0,
  SwitchNetwork = 1,
  SwitchAccount = 2,
}

const SitePermissions = (): JSX.Element => {
  const { t } = useTranslation()

  const infoTextSize = 'body3'

  return (
    <Flex
      backgroundColor="$surface2"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      minHeight={44}
      p="$spacing12"
    >
      <Flex centered row justifyContent="space-between">
        <Text $short={{ variant: 'body3' }} allowFontScaling={false} color="$neutral2" variant="body3">
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
            variant={infoTextSize}
          >
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
            variant={infoTextSize}
          >
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
            variant={infoTextSize}
          >
            {t('walletConnect.permissions.option.transferAssets')}
          </Text>
        </Flex>
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
    <TouchableArea disabled={!accountIsSwitchable} m="$none" testID={TestID.WCDappSwitchAccount} onPress={onPress}>
      <Flex row justifyContent="space-between">
        <AddressFooter activeAccountAddress={activeAddress} px="$spacing8" />
        {accountIsSwitchable && <RotatableChevron color="$neutral2" direction="down" height={16} width={16} />}
      </Flex>
    </TouchableArea>
  )
}

export const PendingConnectionModal = ({ pendingSession, onClose }: Props): JSX.Element => {
  const { t } = useTranslation()

  const dispatch = useDispatch()
  const activeAddress = useActiveAccountAddressWithThrow()
  const activeAccount = useActiveAccountWithThrow()
  const didOpenFromDeepLink = useSelector(selectDidOpenFromDeepLink)

  const [modalState, setModalState] = useState<PendingConnectionModalState>(PendingConnectionModalState.Hidden)

  const onPressSettleConnection = useCallback(
    async (approved: boolean) => {
      sendAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
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
          }),
        )

        dispatch(
          pushNotification({
            type: AppNotificationType.WalletConnect,
            address: activeAddress,
            event: WalletConnectEvent.Connected,
            dappName: session.peer.metadata.name,
            imageUrl: session.peer.metadata.icons[0] ?? null,
            hideDelay: 3 * ONE_SECOND_MS,
          }),
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
        await returnToPreviousApp()
        setDidOpenFromDeepLink(false)
      }
    },
    [activeAddress, dispatch, onClose, pendingSession, didOpenFromDeepLink],
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
        onReject={(): Promise<void> => onPressSettleConnection(false)}
      >
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
      <Flex alignItems="center" gap="$spacing8" justifyContent="flex-end" pb="$spacing4">
        <DappHeaderIcon dapp={pendingSession.dapp} />
        <Text textAlign="center" variant="heading3">
          {t('walletConnect.pending.title', {
            dappName,
          })}
        </Text>
        <LinkButton
          color={colors.accent1.val}
          label={formatDappURL(pendingSession.dapp.url)}
          mb="$spacing12"
          px="$spacing8"
          py="$spacing4"
          showIcon={false}
          textVariant="buttonLabel2"
          url={pendingSession.dapp.url}
        />
      </Flex>
      <SitePermissions />
      <Flex pb="$spacing12" pt="$spacing16" px="$spacing8">
        <SwitchAccountRow activeAddress={activeAddress} setModalState={setModalState} />
      </Flex>
      <Animated.View style={bottomSpacerStyle} />
    </>
  )
}
