import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { WalletConnectRequestModal } from 'src/components/Requests/RequestModal/WalletConnectRequestModal'
import { PendingConnectionModal } from 'src/components/Requests/ScanSheet/PendingConnectionModal'
import { WalletConnectModal } from 'src/components/Requests/ScanSheet/WalletConnectModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import {
  WalletConnectRequest,
  removePendingSession,
  removeRequest,
  setDidOpenFromDeepLink,
} from 'src/features/walletConnect/walletConnectSlice'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { Flex, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
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
  useAppStateTrigger('active', 'inactive', () => {
    dispatch(setDidOpenFromDeepLink(undefined))
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
    if (modalState.isOpen && pendingSession) {
      dispatch(closeModal({ name: ModalName.WalletConnectScan }))
    }
  }, [modalState.isOpen, pendingSession, dispatch])

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
  currRequest: WalletConnectRequest
}

function RequestModal({ currRequest }: RequestModalProps): JSX.Element {
  const signerAccounts = useSignerAccounts()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const colors = useSporeColors()

  // TODO: Move returnToPreviousApp() call to onClose but ensure it is not called twice
  const onClose = (): void => {
    dispatch(removeRequest({ requestInternalId: currRequest.internalId, account: activeAccountAddress }))
  }

  const isRequestFromSignerAccount = signerAccounts.some((account) =>
    areAddressesEqual(account.address, currRequest.account),
  )

  if (!isRequestFromSignerAccount) {
    return (
      <WarningModal
        caption={t('walletConnect.request.warning.message')}
        closeText={t('common.button.dismiss')}
        icon={
          <EyeIcon color={colors.neutral2.get()} height={iconSizes.icon24} strokeWidth={1.5} width={iconSizes.icon24} />
        }
        isOpen={!isRequestFromSignerAccount}
        modalName={ModalName.WCViewOnlyWarning}
        severity={WarningSeverity.None}
        title={t('walletConnect.request.warning.title')}
        onCancel={onClose}
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
