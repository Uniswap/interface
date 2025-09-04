import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { WalletConnectRequestModal } from 'src/components/Requests/RequestModal/WalletConnectRequestModal'
import { PendingConnectionModal } from 'src/components/Requests/ScanSheet/PendingConnectionModal'
import { WalletConnectModal } from 'src/components/Requests/ScanSheet/WalletConnectModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import {
  removePendingSession,
  removeRequest,
  setDidOpenFromDeepLink,
  WalletConnectSigningRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { Flex } from 'ui/src'
import { Eye } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { useActiveAccount, useActiveAccountAddressWithThrow, useSignerAccounts } from 'wallet/src/features/wallet/hooks'

const WalletConnectModalName = {
  Scan: ModalName.WalletConnectScan,
  PendingSession: 'wallet-connect-pending-session',
  Request: 'wallet-connect-request-modal',
} as const

export function WalletConnectModals(): JSX.Element {
  const activeAccount = useActiveAccount()
  const dispatch = useDispatch()

  const { pendingRequests, modalState, pendingSession } = useWalletConnect(activeAccount?.address)

  /*
   * Reset didOpenFromDeepLink state when app is backgrounded, since we only want
   * to call `returnToPreviousApp` when the app was deep linked to from another app.
   * Handles case where user opens app via WalletConnect deep link, backgrounds app, then
   * opens Uniswap app via Spotlight search – we don't want `returnToPreviousApp` to return
   * to Spotlight search.
   * */
  useAppStateTrigger({
    from: 'active',
    to: 'inactive',
    callback: () => {
      dispatch(setDidOpenFromDeepLink(undefined))
    },
  })

  const currRequest = pendingRequests[0] ?? null

  const onCloseWCModal = (): void => {
    dispatch(closeModal({ name: ModalName.WalletConnectScan }))
  }

  // TODO: Move returnToPreviousApp() call to onClose but ensure it is not called twice
  const onClosePendingConnection = (): void => {
    dispatch(removePendingSession())
  }

  // When WalletConnectModal is open and a WC QR code is scanned to add a pendingSession,
  // dismiss the scan modal in favor of showing PendingConnectionModal
  useEffect(() => {
    if (modalState.isOpen && (pendingSession || currRequest)) {
      dispatch(closeModal({ name: ModalName.WalletConnectScan }))
    }
  }, [modalState.isOpen, pendingSession, currRequest, dispatch])

  return (
    <>
      {modalState.isOpen && (
        <ErrorBoundary
          showNotification
          fallback={null}
          name={WalletConnectModalName.Scan}
          onError={() => dispatch(closeModal({ name: ModalName.WalletConnectScan }))}
        >
          <WalletConnectModal initialScreenState={modalState.initialState} onClose={onCloseWCModal} />
        </ErrorBoundary>
      )}
      {pendingSession ? (
        <ErrorBoundary
          showNotification
          fallback={null}
          name={WalletConnectModalName.PendingSession}
          onError={onClosePendingConnection}
        >
          <PendingConnectionModal pendingSession={pendingSession} onClose={onClosePendingConnection} />
        </ErrorBoundary>
      ) : null}
      {currRequest ? (
        <ErrorBoundary
          showNotification
          fallback={null}
          name={WalletConnectModalName.Request}
          onError={() =>
            dispatch(removeRequest({ requestInternalId: currRequest.internalId, account: currRequest.account }))
          }
        >
          <RequestModal currRequest={currRequest} />
        </ErrorBoundary>
      ) : null}
    </>
  )
}

type RequestModalProps = {
  currRequest: WalletConnectSigningRequest
}

function RequestModal({ currRequest }: RequestModalProps): JSX.Element {
  const signerAccounts = useSignerAccounts()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // TODO: Move returnToPreviousApp() call to onClose but ensure it is not called twice
  const onClose = (): void => {
    dispatch(removeRequest({ requestInternalId: currRequest.internalId, account: activeAccountAddress }))
  }

  const isRequestFromSignerAccount = signerAccounts.some((account) =>
    // TODO(WALL-7065): Update to support solana
    areAddressesEqual({
      addressInput1: { address: account.address, platform: Platform.EVM },
      addressInput2: { address: currRequest.account, platform: Platform.EVM },
    }),
  )

  if (!isRequestFromSignerAccount) {
    return (
      <WarningModal
        caption={t('walletConnect.request.warning.message')}
        rejectText={t('common.button.dismiss')}
        icon={<Eye color="$neutral1" size="$icon.24" />}
        isOpen={!isRequestFromSignerAccount}
        modalName={ModalName.WCViewOnlyWarning}
        severity={WarningSeverity.None}
        title={t('walletConnect.request.warning.title')}
        onReject={onClose}
        onClose={onClose}
      >
        <Flex alignSelf="stretch" backgroundColor="$surface2" borderRadius="$rounded16" p="$spacing16">
          <AccountDetails address={currRequest.account} iconSize={iconSizes.icon24} />
        </Flex>
      </WarningModal>
    )
  }

  return <WalletConnectRequestModal request={currRequest} onClose={onClose} />
}
