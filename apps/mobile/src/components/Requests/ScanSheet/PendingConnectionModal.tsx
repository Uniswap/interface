import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useNetInfo } from '@react-native-community/netinfo'
import { getSdkError } from '@walletconnect/utils'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { DappHeaderIcon } from 'src/components/Requests/DappHeaderIcon'
import { ModalWithOverlay, ModalWithOverlayProps } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { PendingConnectionSwitchAccountModal } from 'src/components/Requests/ScanSheet/PendingConnectionSwitchAccountModal'
import { SitePermissions } from 'src/components/Requests/ScanSheet/SitePermissions'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { getSessionNamespaces } from 'src/features/walletConnect/utils'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import {
  WalletConnectPendingSession,
  WalletConnectVerifyStatus,
  addSession,
  removePendingSession,
  setDidOpenFromDeepLink,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AlertTriangleFilled, CheckCircleFilled, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { DappRequestType, WCEventType, WCRequestOutcome, WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { formatDappURL } from 'utilities/src/format/urls'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { LinkButton } from 'wallet/src/components/buttons/LinkButton'
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

export const PendingConnectionModal = ({ pendingSession, onClose }: Props): JSX.Element => {
  const { t } = useTranslation()

  const dispatch = useDispatch()
  const activeAddress = useActiveAccountAddressWithThrow()
  const activeAccount = useActiveAccountWithThrow()
  const didOpenFromDeepLink = useSelector(selectDidOpenFromDeepLink)

  const [modalState, setModalState] = useState<PendingConnectionModalState>(PendingConnectionModalState.Hidden)
  const [confirmedWarning, setConfirmedWarning] = useState(false)

  const netInfo = useNetInfo()
  const showConnectionError = !netInfo.isInternetReachable

  const isThreat = pendingSession.verifyStatus === WalletConnectVerifyStatus.Threat
  const confirmDisabled = (isThreat && !confirmedWarning) || showConnectionError

  const onPressSettleConnection = useCallback(
    async (approved: boolean) => {
      sendAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
        request_type: WCEventType.SessionPending,
        dapp_url: pendingSession.dappRequestInfo.url,
        dapp_name: pendingSession.dappRequestInfo.name,
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
              dappRequestInfo: {
                name: session.peer.metadata.name,
                url: session.peer.metadata.url,
                icon: session.peer.metadata.icons[0] ?? null,
                requestType: DappRequestType.WalletConnectSessionRequest,
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

  const dappName = pendingSession.dappRequestInfo.name || pendingSession.dappRequestInfo.url || ''

  const isThreatProps: Partial<ModalWithOverlayProps> = isThreat
    ? {
        cancelButtonText: t('walletConnect.pending.button.reject'),
        cancelButtonProps: {
          backgroundColor: '$statusCritical',
          emphasis: 'primary',
        },
        confirmationButtonProps: {
          variant: 'default',
          emphasis: 'tertiary',
          backgroundColor: '$surface3',
        },
      }
    : {}

  return (
    <>
      <ModalWithOverlay
        confirmationButtonText={t('walletConnect.pending.button.connect')}
        name={ModalName.WCPendingConnection}
        scrollDownButtonText={t('walletConnect.pending.button.scrollDown')}
        disableConfirm={confirmDisabled}
        onClose={onClose}
        onConfirm={(): Promise<void> => onPressSettleConnection(true)}
        onReject={(): Promise<void> => onPressSettleConnection(false)}
        {...isThreatProps}
      >
        <PendingConnectionModalContent
          activeAddress={activeAddress}
          dappName={dappName}
          verifyStatus={pendingSession.verifyStatus}
          pendingSession={pendingSession}
          setModalState={setModalState}
          confirmedWarning={confirmedWarning}
          showConnectionError={showConnectionError}
          onConfirmWarning={setConfirmedWarning}
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
  verifyStatus: WalletConnectVerifyStatus
  setModalState: (state: PendingConnectionModalState.SwitchAccount) => void
  onConfirmWarning: (confirmed: boolean) => void
  confirmedWarning: boolean
  showConnectionError?: boolean
}

function PendingConnectionModalContent({
  activeAddress,
  dappName,
  pendingSession,
  verifyStatus,
  setModalState,
  onConfirmWarning,
  confirmedWarning,
  showConnectionError,
}: PendingConnectionModalContentProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const { animatedFooterHeight } = useBottomSheetInternal()

  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value,
  }))

  return (
    <>
      <Flex gap="$spacing8" pb="$spacing24">
        <DappHeaderIcon dappRequestInfo={pendingSession.dappRequestInfo} />
        <Text variant="subheading1">
          {t('walletConnect.pending.title', {
            dappName,
          })}
        </Text>
        <Flex row gap="$spacing4" alignItems="center">
          <LinkButton
            justifyContent="flex-start"
            color={
              verifyStatus === WalletConnectVerifyStatus.Threat
                ? colors.statusCritical.val
                : verifyStatus === WalletConnectVerifyStatus.Unverified
                  ? colors.neutral2.val
                  : colors.accent1.val
            }
            label={formatDappURL(pendingSession.dappRequestInfo.url)}
            showIcon={false}
            textVariant="buttonLabel4"
            url={pendingSession.dappRequestInfo.url}
          />
          {verifyStatus === WalletConnectVerifyStatus.Verified && (
            <CheckCircleFilled color={colors.accent1.val} size="$icon.16" />
          )}
        </Flex>
      </Flex>
      <SitePermissions
        verifyStatus={pendingSession.verifyStatus}
        confirmedWarning={confirmedWarning}
        onConfirmWarning={onConfirmWarning}
      />
      <Flex pb="$spacing12" pt="$spacing16" px="$spacing8">
        <SwitchAccountRow activeAddress={activeAddress} setModalState={setModalState} />
      </Flex>
      {showConnectionError && (
        <BaseCard.InlineErrorState
          backgroundColor="$statusWarning2"
          icon={<AlertTriangleFilled color="$statusWarning" size="$icon.16" />}
          textColor="$statusWarning"
          title={t('walletConnect.request.error.network')}
        />
      )}
      <Animated.View style={bottomSpacerStyle} />
    </>
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
        {accountIsSwitchable && (
          <RotatableChevron color="$neutral2" direction="down" height={iconSizes.icon16} width={iconSizes.icon16} />
        )}
      </Flex>
    </TouchableArea>
  )
}
