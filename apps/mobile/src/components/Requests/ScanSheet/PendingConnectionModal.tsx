import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { getSdkError } from '@walletconnect/utils'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { ModalWithOverlay, ModalWithOverlayProps } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { convertCapabilitiesToScopedProperties, getSessionNamespaces } from 'src/features/walletConnect/utils'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import {
  addSession,
  removePendingSession,
  setDidOpenFromDeepLink,
  WalletConnectPendingSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex } from 'ui/src'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { DappRequestType, WalletConnectEvent, WCEventType, WCRequestOutcome } from 'uniswap/src/types/walletConnect'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { DappConnectionContent } from 'wallet/src/components/dappRequests/DappConnectionContent'
import { DappRequestHeader } from 'wallet/src/components/dappRequests/DappRequestHeader'
import { getCapabilitiesCore } from 'wallet/src/features/batchedTransactions/utils'
import { useBlockaidVerification } from 'wallet/src/features/dappRequests/hooks/useBlockaidVerification'
import { useDappConnectionConfirmation } from 'wallet/src/features/dappRequests/hooks/useDappConnectionConfirmation'
import { DappConnectionInfo, DappVerificationStatus } from 'wallet/src/features/dappRequests/types'
import { mergeVerificationStatuses } from 'wallet/src/features/dappRequests/verification'
import {
  useActiveAccountWithThrow,
  useHasSmartWalletConsent,
  useSignerAccounts,
} from 'wallet/src/features/wallet/hooks'

type Props = {
  pendingSession: WalletConnectPendingSession
  onClose: () => void
}

export const PendingConnectionModal = ({ pendingSession, onClose }: Props): JSX.Element => {
  const { t } = useTranslation()

  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const activeAddress = activeAccount.address
  const isViewOnly = activeAccount.type === AccountType.Readonly

  const didOpenFromDeepLink = useSelector(selectDidOpenFromDeepLink)
  const hasSmartWalletConsent = useHasSmartWalletConsent()
  const eip5792MethodsEnabled = useFeatureFlag(FeatureFlags.Eip5792Methods)

  const [isConnecting, setIsConnecting] = useState(false)

  // Merge WalletConnect verification with Blockaid verification
  const { verificationStatus: blockaidStatus } = useBlockaidVerification(pendingSession.dappRequestInfo.url)
  const finalVerificationStatus = mergeVerificationStatuses(pendingSession.verifyStatus, blockaidStatus)

  const { confirmedWarning, setConfirmedWarning, disableConfirm } = useDappConnectionConfirmation({
    verificationStatus: finalVerificationStatus,
    isViewOnly,
    isLoading: isConnecting,
  })

  const signerAccounts = useSignerAccounts()
  const defaultSelectedAccountAddresses = useMemo(() => {
    return signerAccounts.map((account) => account.address)
  }, [signerAccounts])

  const [selectedAccountAddresses, setSelectedAccountAddresses] = useState<string[]>(defaultSelectedAccountAddresses)

  // Sort the active account to the front of the list in the UI
  const orderedAllAccountAddresses = useMemo(() => {
    return [...signerAccounts.map((account) => account.address)].sort((a, b) => {
      if (a === activeAddress) {
        return -1
      }
      if (b === activeAddress) {
        return 1
      }
      return 0
    })
  }, [signerAccounts, activeAddress])

  // Sort the active account to the front of the list, so that when we construct namespaces, the active account is first,
  // so that it appears as the active connection on the dapp
  const orderedSelectedAccountAddresses = useMemo(() => {
    return [...selectedAccountAddresses].sort((a, b) => {
      return a === activeAddress ? -1 : b === activeAddress ? 1 : 0
    })
  }, [selectedAccountAddresses, activeAddress])

  const onPressSettleConnection = useEvent(async (approved: boolean) => {
    // Prevent multiple concurrent connection attempts
    if (isConnecting) {
      return
    }

    setIsConnecting(true)

    try {
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
        const namespaces = getSessionNamespaces(orderedSelectedAccountAddresses, pendingSession.proposalNamespaces)
        const capabilities = await getCapabilitiesCore({
          address: activeAddress,
          chainIds: pendingSession.chains,
          hasSmartWalletConsent: hasSmartWalletConsent ?? false,
        })

        const scopedProperties = convertCapabilitiesToScopedProperties(capabilities)

        const session = await wcWeb3Wallet.approveSession({
          id: Number(pendingSession.id),
          namespaces,
          ...(eip5792MethodsEnabled ? { scopedProperties } : {}),
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
              activeAccount: activeAddress,
              ...(eip5792MethodsEnabled ? { capabilities } : {}),
            },
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
    } catch {
      setIsConnecting(false)
    } finally {
      setIsConnecting(false)
    }
  })

  const isThreat = finalVerificationStatus === DappVerificationStatus.Threat
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
        disableConfirm={disableConfirm}
        confirmationLoading={isConnecting}
        onClose={onClose}
        onConfirm={(): Promise<void> => onPressSettleConnection(true)}
        onReject={(): Promise<void> => onPressSettleConnection(false)}
        {...isThreatProps}
      >
        <PendingConnectionModalContent
          isViewOnly={isViewOnly}
          pendingSession={pendingSession}
          verifyStatus={finalVerificationStatus}
          allAccountAddresses={orderedAllAccountAddresses}
          selectedAccountAddresses={selectedAccountAddresses}
          setSelectedAccountAddresses={setSelectedAccountAddresses}
          confirmedWarning={confirmedWarning}
          onConfirmWarning={setConfirmedWarning}
        />
      </ModalWithOverlay>
    </>
  )
}

type PendingConnectionModalContentProps = {
  allAccountAddresses: string[]
  selectedAccountAddresses: string[]
  setSelectedAccountAddresses: (addresses: string[]) => void
  pendingSession: WalletConnectPendingSession
  verifyStatus: DappVerificationStatus
  isViewOnly: boolean
  onConfirmWarning: (confirmed: boolean) => void
  confirmedWarning: boolean
}

function PendingConnectionModalContent({
  allAccountAddresses,
  selectedAccountAddresses,
  setSelectedAccountAddresses,
  pendingSession,
  verifyStatus,
  isViewOnly,
  onConfirmWarning,
  confirmedWarning,
}: PendingConnectionModalContentProps): JSX.Element {
  const { t } = useTranslation()
  const { animatedFooterHeight } = useBottomSheetInternal()

  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value,
  }))

  const dappInfo: DappConnectionInfo = {
    name: pendingSession.dappRequestInfo.name,
    url: pendingSession.dappRequestInfo.url,
    icon: pendingSession.dappRequestInfo.icon,
  }

  return (
    <>
      <Flex pb="$spacing24">
        <DappRequestHeader
          dappInfo={dappInfo}
          title={t('dapp.request.connect.title')}
          verificationStatus={verifyStatus}
        />
      </Flex>
      <DappConnectionContent
        verificationStatus={verifyStatus}
        confirmedWarning={confirmedWarning}
        allAccountAddresses={allAccountAddresses}
        selectedAccountAddresses={selectedAccountAddresses}
        setSelectedAccountAddresses={setSelectedAccountAddresses}
        isViewOnly={isViewOnly}
        bottomSpacing={<Animated.View style={bottomSpacerStyle} />}
        onConfirmWarning={onConfirmWarning}
      />
    </>
  )
}
