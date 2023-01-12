import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import EyeIcon from 'src/assets/icons/eye.svg'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { Box } from 'src/components/layout'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { WalletConnectRequestModal } from 'src/components/WalletConnect/RequestModal/WalletConnectRequestModal'
import { WalletConnectSwitchChainModal } from 'src/components/WalletConnect/RequestModal/WalletConnectSwitchChainModal'
import { WalletConnectModal } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  useActiveAccount,
  useActiveAccountAddressWithThrow,
  useSignerAccounts,
} from 'src/features/wallet/hooks'
import { EthMethod } from 'src/features/walletConnect/types'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import {
  removePendingSession,
  removeRequest,
  SwitchChainRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'

export function WalletConnectModals() {
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()

  const { pendingRequests, modalState, pendingSession } = useWalletConnect(activeAccount?.address)

  const currRequest = pendingRequests[0] ?? null

  const onClose = useCallback(() => {
    dispatch(removePendingSession())
    dispatch(closeModal({ name: ModalName.WalletConnectScan }))
  }, [dispatch])

  return (
    <>
      {(modalState.isOpen || Boolean(pendingSession)) && (
        <WalletConnectModal
          initialScreenState={modalState.initialState}
          pendingSession={pendingSession}
          onClose={onClose}
        />
      )}
      {currRequest ? <RequestModal currRequest={currRequest} /> : null}
    </>
  )
}

type RequestModalProps = {
  currRequest: WalletConnectRequest
}

function RequestModal({ currRequest }: RequestModalProps) {
  const signerAccounts = useSignerAccounts()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const onClose = () => {
    dispatch(
      removeRequest({ requestInternalId: currRequest.internalId, account: activeAccountAddress })
    )
  }

  if (isSwitchNetworkRequest(currRequest)) {
    return <WalletConnectSwitchChainModal request={currRequest} onClose={onClose} />
  }

  const isRequestFromSignerAccount = signerAccounts.some(
    (account) => account.address === currRequest.account
  )

  if (!isRequestFromSignerAccount) {
    return (
      <WarningModal
        caption={t(
          'In order to sign messages or transactions, you’ll need to import the wallet’s recovery phrase.'
        )}
        closeText={t('Dismiss')}
        icon={
          <EyeIcon
            color={theme.colors.textSecondary}
            height={theme.iconSizes.lg}
            strokeWidth={1.5}
            width={theme.iconSizes.lg}
          />
        }
        modalName={ModalName.WCViewOnlyWarning}
        severity={WarningSeverity.None}
        title={t('This wallet is in view only mode')}
        onCancel={onClose}
        onClose={onClose}>
        <Box alignSelf="stretch" backgroundColor="background2" borderRadius="lg" p="md">
          <AccountDetails address={currRequest.account} iconSize={theme.iconSizes.lg} />
        </Box>
      </WarningModal>
    )
  }

  return <WalletConnectRequestModal request={currRequest} onClose={onClose} />
}

function isSwitchNetworkRequest(request: WalletConnectRequest): request is SwitchChainRequest {
  return request.type === EthMethod.SwitchChain || request.type === EthMethod.AddChain
}
