import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { getSdkError } from '@walletconnect/utils'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { DappHeaderIcon } from 'src/components/Requests/DappHeaderIcon'
import { ModalWithOverlay, ModalWithOverlayProps } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { AccountSelectPopover } from 'src/components/Requests/ScanSheet/AccountSelectPopover'
import { SitePermissions } from 'src/components/Requests/ScanSheet/SitePermissions'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { getSessionNamespaces } from 'src/features/walletConnect/utils'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import {
  addSession,
  removePendingSession,
  setDidOpenFromDeepLink,
  WalletConnectPendingSession,
  WalletConnectVerifyStatus,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, useSporeColors } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { DappRequestType, WalletConnectEvent, WCEventType, WCRequestOutcome } from 'uniswap/src/types/walletConnect'
import { formatDappURL } from 'utilities/src/format/urls'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { LinkButton } from 'wallet/src/components/buttons/LinkButton'
import { useActiveAccountWithThrow, useSignerAccounts } from 'wallet/src/features/wallet/hooks'

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

  const [confirmedWarning, setConfirmedWarning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const isThreat = pendingSession.verifyStatus === WalletConnectVerifyStatus.Threat
  const disableConfirm = (isThreat && !confirmedWarning) || isViewOnly || isConnecting

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
              activeAccount: activeAddress,
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
    } catch (_error) {
      setIsConnecting(false)
    } finally {
      setIsConnecting(false)
    }
  })

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
        disableConfirm={disableConfirm}
        confirmationLoading={isConnecting}
        onClose={onClose}
        onConfirm={(): Promise<void> => onPressSettleConnection(true)}
        onReject={(): Promise<void> => onPressSettleConnection(false)}
        {...isThreatProps}
      >
        <PendingConnectionModalContent
          isViewOnly={isViewOnly}
          dappName={dappName}
          verifyStatus={pendingSession.verifyStatus}
          pendingSession={pendingSession}
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
  dappName: string
  pendingSession: WalletConnectPendingSession
  verifyStatus: WalletConnectVerifyStatus
  isViewOnly: boolean
  onConfirmWarning: (confirmed: boolean) => void
  confirmedWarning: boolean
}

function PendingConnectionModalContent({
  allAccountAddresses,
  selectedAccountAddresses,
  setSelectedAccountAddresses,
  dappName,
  pendingSession,
  verifyStatus,
  isViewOnly,
  onConfirmWarning,
  confirmedWarning,
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
            <CheckCircleFilled color={colors.statusCritical.val} size="$icon.16" />
          )}
        </Flex>
      </Flex>
      <SitePermissions
        verifyStatus={pendingSession.verifyStatus}
        confirmedWarning={confirmedWarning}
        onConfirmWarning={onConfirmWarning}
      />
      {!isViewOnly && (
        <Flex pb="$spacing12" pt="$spacing16" px="$spacing8">
          <AccountSelectPopover
            selectedAccountAddresses={selectedAccountAddresses}
            setSelectedAccountAddresses={setSelectedAccountAddresses}
            allAccountAddresses={allAccountAddresses}
          />
        </Flex>
      )}
      {isViewOnly && (
        <Flex
          centered
          row
          backgroundColor="$surface2"
          borderRadius="$rounded12"
          minHeight={40}
          p="$spacing8"
          mt="$spacing16"
        >
          <Text color="$neutral2" variant="body2">
            {t('home.warning.viewOnly')}
          </Text>
        </Flex>
      )}
      <Animated.View style={bottomSpacerStyle} />
    </>
  )
}
