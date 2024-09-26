import { useNetInfo } from '@react-native-community/netinfo'
import { getSdkError } from '@walletconnect/utils'
import { providers } from 'ethers'
import React, { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ModalWithOverlay } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { KidSuperCheckinModal } from 'src/components/Requests/RequestModal/KidSuperCheckinModal'
import { UwULinkErc20SendModal } from 'src/components/Requests/RequestModal/UwULinkErc20SendModal'
import {
  WalletConnectRequestModalContent,
  methodCostsGas,
} from 'src/components/Requests/RequestModal/WalletConnectRequestModalContent'
import { useHasSufficientFunds } from 'src/components/Requests/RequestModal/hooks'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { signWcRequestActions } from 'src/features/walletConnect/signWcRequestSaga'
import { WalletConnectRequest, isTransactionRequest } from 'src/features/walletConnect/walletConnectSlice'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { EthMethod, UwULinkMethod, WCEventType, WCRequestOutcome } from 'uniswap/src/types/walletConnect'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { formatExternalTxnWithGasEstimates } from 'wallet/src/features/gas/formatExternalTxnWithGasEstimates'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

interface Props {
  onClose: () => void
  request: WalletConnectRequest
}

const VALID_REQUEST_TYPES = [
  EthMethod.PersonalSign,
  EthMethod.SignTypedData,
  EthMethod.SignTypedDataV4,
  EthMethod.EthSign,
  EthMethod.EthSendTransaction,
  UwULinkMethod.Erc20Send,
]

export function WalletConnectRequestModal({ onClose, request }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const netInfo = useNetInfo()
  const didOpenFromDeepLink = useSelector(selectDidOpenFromDeepLink)
  const chainId = request.chainId

  const tx: providers.TransactionRequest | undefined = useMemo(() => {
    if (!isTransactionRequest(request)) {
      return undefined
    }

    return { ...request.transaction, chainId }
  }, [chainId, request])

  const signerAccounts = useSignerAccounts()
  const signerAccount = signerAccounts.find((account) => areAddressesEqual(account.address, request.account))
  const gasFee = useTransactionGasFee(tx)

  const hasSufficientFunds = useHasSufficientFunds({
    account: request.account,
    chainId,
    gasFee,
    value: isTransactionRequest(request) ? request.transaction.value : undefined,
  })

  const { isBlocked: isSenderBlocked, isBlockedLoading: isSenderBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlocked(tx?.to)

  const isBlocked = isSenderBlocked ?? isRecipientBlocked
  const isBlockedLoading = isSenderBlockedLoading || isRecipientBlockedLoading

  const checkConfirmEnabled = (): boolean => {
    if (!netInfo.isInternetReachable) {
      return false
    }

    if (!signerAccount) {
      return false
    }

    if (isBlocked || isBlockedLoading) {
      return false
    }

    if (methodCostsGas(request)) {
      return !!(tx && hasSufficientFunds && gasFee.value && !gasFee.error && !gasFee.isLoading)
    }

    if (isTransactionRequest(request)) {
      return !!tx
    }

    return true
  }

  const confirmEnabled = checkConfirmEnabled()
  const dispatch = useDispatch()
  /**
   * TODO: [MOB-239] implement this behavior in a less janky way. Ideally if we can distinguish between `onClose` being called programmatically and `onClose` as a results of a user dismissing the modal then we can determine what this value should be without this class variable.
   * Indicates that the modal can reject the request when the modal happens. This will be false when the modal closes as a result of the user explicitly confirming or rejecting a request and true otherwise.
   */
  const rejectOnCloseRef = useRef(true)

  const onReject = async (): Promise<void> => {
    if (request.dapp.source === 'walletconnect') {
      await wcWeb3Wallet.respondSessionRequest({
        topic: request.sessionId,
        response: {
          id: Number(request.internalId),
          jsonrpc: '2.0',
          error: getSdkError('USER_REJECTED'),
        },
      })
    }

    rejectOnCloseRef.current = false

    sendAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
      request_type: isTransactionRequest(request) ? WCEventType.TransactionRequest : WCEventType.SignRequest,
      eth_method: request.type,
      dapp_url: request.dapp.url,
      dapp_name: request.dapp.name,
      wc_version: '2',
      chain_id: chainId,
      outcome: WCRequestOutcome.Reject,
    })

    onClose()
    if (didOpenFromDeepLink) {
      returnToPreviousApp()
    }
  }

  const onConfirm = async (): Promise<void> => {
    if (!confirmEnabled || !signerAccount) {
      return
    }

    if (request.type === EthMethod.EthSendTransaction || request.type === UwULinkMethod.Erc20Send) {
      if (!tx) {
        return
      }
      const txnWithFormattedGasEstimates = formatExternalTxnWithGasEstimates({
        transaction: tx,
        gasFeeResult: gasFee,
      })

      dispatch(
        signWcRequestActions.trigger({
          sessionId: request.sessionId,
          requestInternalId: request.internalId,
          method: EthMethod.EthSendTransaction,
          transaction: txnWithFormattedGasEstimates,
          account: signerAccount,
          dapp: request.dapp,
          chainId,
          request,
        }),
      )
    } else {
      dispatch(
        signWcRequestActions.trigger({
          sessionId: request.sessionId,
          requestInternalId: request.internalId,
          // this is EthSignMessage type
          method: request.type,
          message: request.message || request.rawMessage,
          account: signerAccount,
          dapp: request.dapp,
          chainId,
        }),
      )
    }

    rejectOnCloseRef.current = false

    sendAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
      request_type: isTransactionRequest(request) ? WCEventType.TransactionRequest : WCEventType.SignRequest,
      eth_method: request.type,
      dapp_url: request.dapp.url,
      dapp_name: request.dapp.name,
      wc_version: '2',
      chain_id: chainId,
      outcome: WCRequestOutcome.Confirm,
    })

    onClose()
    if (didOpenFromDeepLink) {
      returnToPreviousApp()
    }
  }

  const { trigger: actionButtonTrigger } = useBiometricPrompt(onConfirm)
  const { requiredForTransactions } = useBiometricAppSettings()

  const onConfirmPress = async (): Promise<void> => {
    if (requiredForTransactions) {
      await actionButtonTrigger()
    } else {
      await onConfirm()
    }
  }

  if (!VALID_REQUEST_TYPES.includes(request.type)) {
    return null
  }

  const handleClose = async (): Promise<void> => {
    if (rejectOnCloseRef.current) {
      await onReject()
    } else {
      onClose()
    }
  }

  if (request.type === UwULinkMethod.Erc20Send) {
    return (
      <UwULinkErc20SendModal
        confirmEnabled={confirmEnabled}
        gasFee={gasFee}
        hasSufficientGasFunds={hasSufficientFunds}
        request={request}
        onClose={handleClose}
        onConfirm={onConfirmPress}
        onReject={onReject}
      />
    )
  }

  // KidSuper Uniswap Cafe check-in screen
  if (request.type === EthMethod.PersonalSign && request.dapp.name === 'Uniswap Cafe') {
    return (
      <KidSuperCheckinModal request={request} onClose={handleClose} onConfirm={onConfirmPress} onReject={onReject} />
    )
  }

  return (
    <ModalWithOverlay
      confirmationButtonText={
        isTransactionRequest(request) ? t('common.button.accept') : t('walletConnect.request.button.sign')
      }
      disableConfirm={!confirmEnabled}
      name={ModalName.WCSignRequest}
      scrollDownButtonText={t('walletConnect.request.button.scrollDown')}
      onClose={handleClose}
      onConfirm={onConfirmPress}
      onReject={onReject}
    >
      <WalletConnectRequestModalContent
        gasFee={gasFee}
        hasSufficientFunds={hasSufficientFunds}
        isBlocked={isBlocked}
        request={request}
      />
    </ModalWithOverlay>
  )
}
