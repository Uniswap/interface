import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { confirmRequest, confirmRequestNoDappInfo, rejectRequest } from 'src/app/features/dappRequests/actions'
import { useTransactionConfirmationTracker } from 'src/app/features/dappRequests/context/TransactionConfirmationTracker'
import { isDappRequestWithDappInfo } from 'src/app/features/dappRequests/saga'
import type { DappRequestStoreItem } from 'src/app/features/dappRequests/shared'
import { selectAllDappRequests } from 'src/app/features/dappRequests/slice'
import { DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { DappRequestAction } from 'uniswap/src/features/telemetry/types'
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { useEvent } from 'utilities/src/react/hooks'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface DappRequestQueueContextValue {
  forwards: boolean // direction of sliding animation
  increasing: boolean // direction of number increasing animation
  request: DappRequestStoreItem | undefined
  currentAccount: Account // Account the request is going to (not necessarily the active account)
  dappUrl: string
  dappIconUrl: string
  currentIndex: number
  totalRequestCount: number
  onPressNext: () => void
  onPressPrevious: () => void
  onConfirm: (params: {
    request: DappRequestStoreItem
    transactionTypeInfo?: TransactionTypeInfo
    preSignedTransaction?: SignedTransactionRequest
  }) => Promise<void>
  onCancel: (request: DappRequestStoreItem) => Promise<void>
}

const DappRequestQueueContext = createContext<DappRequestQueueContextValue | undefined>(undefined)

export function DappRequestQueueProvider({ children }: PropsWithChildren): JSX.Element {
  const dispatch = useDispatch()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Show the top most pending request
  const dappRequests = useSelector(selectAllDappRequests)

  const request = dappRequests[currentIndex]
  const totalRequestCount = dappRequests.length

  const activeAccount = useActiveAccountWithThrow()
  const { markTransactionConfirmed } = useTransactionConfirmationTracker()

  // values to help with animations
  const [forwards, setForwards] = useState(true)
  const [increasing, setIncreasing] = useState(true)
  const prevTotalRequestCountRef = useRef(totalRequestCount)

  useEffect(() => {
    if (totalRequestCount > prevTotalRequestCountRef.current) {
      setIncreasing(true)
    }

    if (totalRequestCount < prevTotalRequestCountRef.current) {
      setIncreasing(false)
    }

    prevTotalRequestCountRef.current = totalRequestCount
  }, [totalRequestCount])

  const dappUrl = extractBaseUrl(request?.senderTabInfo.url) || ''
  const dappIconUrl = request?.senderTabInfo.favIconUrl || ''

  let currentAccount = activeAccount
  if (request?.dappInfo) {
    const { activeConnectedAddress, connectedAccounts } = request.dappInfo
    const connectedAccount = connectedAccounts.find((account) => account.address === activeConnectedAddress)

    if (connectedAccount) {
      currentAccount = connectedAccount
    }
  }

  const onConfirm = useEvent(
    async (params: {
      request: DappRequestStoreItem
      transactionTypeInfo?: TransactionTypeInfo
      preSignedTransaction?: SignedTransactionRequest
    }): Promise<void> => {
      const { request, transactionTypeInfo, preSignedTransaction } = params
      const requestWithTxInfo = {
        ...request,
        transactionTypeInfo,
        preSignedTransaction,
      }
      if (request.dappInfo) {
        const { activeConnectedAddress, lastChainId } = request.dappInfo
        const connectedAddresses = request.dappInfo.connectedAccounts.map((account) => account.address)
        sendAnalyticsEvent(ExtensionEventName.DappRequest, {
          action: DappRequestAction.Accept,
          requestType: request.dappRequest.type,
          dappUrl: extractBaseUrl(request.senderTabInfo.url),
          chainId: lastChainId,
          activeConnectedAddress,
          connectedAddresses,
        })
      }

      if (isDappRequestWithDappInfo(requestWithTxInfo)) {
        await dispatch(confirmRequest(requestWithTxInfo))
      } else {
        await dispatch(confirmRequestNoDappInfo(requestWithTxInfo))
      }

      // Mark transaction as confirmed for nonce delay tracking
      // Only mark if we have chain info (transactions that could conflict)
      if (request.dappInfo?.lastChainId) {
        markTransactionConfirmed(request.dappInfo.lastChainId)
      }

      setCurrentIndex((prev) => Math.max(0, prev - 1))
    },
  )

  const onCancel = useEvent(async (requestToCancel: DappRequestStoreItem): Promise<void> => {
    if (requestToCancel.dappInfo) {
      const { activeConnectedAddress, lastChainId } = requestToCancel.dappInfo
      const connectedAddresses = requestToCancel.dappInfo.connectedAccounts.map((account) => account.address)
      sendAnalyticsEvent(ExtensionEventName.DappRequest, {
        action: DappRequestAction.Reject,
        requestType: requestToCancel.dappRequest.type,
        dappUrl: extractBaseUrl(requestToCancel.senderTabInfo.url),
        chainId: lastChainId,
        activeConnectedAddress,
        connectedAddresses,
      })
    }
    await dispatch(
      rejectRequest({
        senderTabInfo: requestToCancel.senderTabInfo,
        errorResponse: {
          requestId: requestToCancel.dappRequest.requestId,
          type: DappResponseType.ErrorResponse,
          error: serializeError(providerErrors.userRejectedRequest()),
        },
      }),
    )

    setCurrentIndex((prev) => Math.max(0, prev - 1))
  })

  const onPressNext = (): void => {
    setForwards(true)
    setCurrentIndex((prev) => Math.min(prev + 1, totalRequestCount - 1))
  }

  const onPressPrevious = (): void => {
    setForwards(false)
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const value = {
    forwards,
    increasing,
    currentIndex,
    totalRequestCount,
    request,
    dappUrl,
    dappIconUrl,
    currentAccount,
    onConfirm,
    onCancel,
    onPressNext,
    onPressPrevious,
  }

  return <DappRequestQueueContext.Provider value={value}>{children}</DappRequestQueueContext.Provider>
}

export function useDappRequestQueueContext(): DappRequestQueueContextValue {
  const context = useContext(DappRequestQueueContext)

  if (context === undefined) {
    throw new Error('useDappRequestQueueContext must be used within a DappRequestQueueProvider')
  }

  return context
}
