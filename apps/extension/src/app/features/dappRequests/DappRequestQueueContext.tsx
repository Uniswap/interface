import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { PropsWithChildren, createContext, useContext, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  confirmRequest,
  confirmRequestNoDappInfo,
  isDappRequestWithDappInfo,
  rejectRequest,
} from 'src/app/features/dappRequests/saga'
import { DappRequestStoreItem } from 'src/app/features/dappRequests/slice'
import { DappResponseType } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { ExtensionState } from 'src/store/extensionReducer'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { DappRequestAction } from 'uniswap/src/features/telemetry/types'
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { extractBaseUrl } from 'utilities/src/format/urls'
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
  onConfirm: (request: DappRequestStoreItem, transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
  onCancel: (request: DappRequestStoreItem) => Promise<void>
}

const DappRequestQueueContext = createContext<DappRequestQueueContextValue | undefined>(undefined)

export function DappRequestQueueProvider({ children }: PropsWithChildren): JSX.Element {
  const dispatch = useDispatch()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Show the top most pending request
  const pendingRequests = useSelector((state: ExtensionState) => state.dappRequests.pending)

  const request = pendingRequests[currentIndex]
  const totalRequestCount = pendingRequests.length

  const activeAccount = useActiveAccountWithThrow()

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
  const dappIconUrl = request?.senderTabInfo?.favIconUrl || ''

  let currentAccount = activeAccount
  if (request?.dappInfo) {
    const { activeConnectedAddress, connectedAccounts } = request.dappInfo
    const connectedAccount = connectedAccounts.find((account) => account.address === activeConnectedAddress)

    if (connectedAccount) {
      currentAccount = connectedAccount
    }
  }

  const onConfirm = async (
    requestToConfirm: DappRequestStoreItem,
    transactionTypeInfo?: TransactionTypeInfo,
  ): Promise<void> => {
    const requestWithTxInfo = {
      ...requestToConfirm,
      transactionTypeInfo,
    }
    if (requestToConfirm.dappInfo) {
      const { activeConnectedAddress, lastChainId } = requestToConfirm.dappInfo
      const connectedAddresses = requestToConfirm.dappInfo.connectedAccounts.map((account) => account.address)
      sendAnalyticsEvent(ExtensionEventName.DappRequest, {
        action: DappRequestAction.Accept,
        requestType: requestToConfirm.dappRequest.type,
        dappUrl: extractBaseUrl(requestToConfirm.senderTabInfo.url),
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

    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const onCancel = async (requestToCancel: DappRequestStoreItem): Promise<void> => {
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
  }

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
