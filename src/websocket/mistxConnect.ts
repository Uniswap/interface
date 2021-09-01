import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { BigNumberish } from '@ethersproject/bignumber'
import { BundleRes, MistxSocket } from '@alchemist-coin/mistx-connect'
import { useFrontrunningProtection } from '../state/user/hooks'
import { useActiveWeb3React } from '../hooks/web3'
// state
import { useAllTransactions } from 'state/transactions/hooks'
import {
  updatePrivateTransaction,
  removePrivateTransaction,
  PrivateTransactionDetails,
} from 'state/transactions/actions'
import { TransactionDetails } from 'state/transactions/reducer'
import { updatePrivateTransactionFees } from 'state/application/actions'
import { useAddPopup } from 'state/application/hooks'

export enum Event {
  GAS_CHANGE = 'GAS_CHANGE',
  SOCKET_SESSION = 'SOCKET_SESSION',
  SOCKET_ERR = 'SOCKET_ERR',
  MISTX_BUNDLE_REQUEST = 'MISTX_BUNDLE_REQUEST',
  BUNDLE_STATUS_REQUEST = 'BUNDLE_STATUS_REQUEST',
  BUNDLE_STATUS_RESPONSE = 'BUNDLE_STATUS_RESPONSE',
  BUNDLE_RESPONSE = 'BUNDLE_RESPONSE',
  BUNDLE_CANCEL_REQUEST = 'BUNDLE_CANCEL_REQUEST',
}

export enum Status {
  PENDING_BUNDLE = 'PENDING_BUNDLE',
  FAILED_BUNDLE = 'FAILED_BUNDLE',
  SUCCESSFUL_BUNDLE = 'SUCCESSFUL_BUNDLE',
  CANCEL_BUNDLE_SUCCESSFUL = 'CANCEL_BUNDLE_SUCCESSFUL',
  BUNDLE_NOT_FOUND = 'BUNDLE_NOT_FOUND',
}

export const STATUS_LOCALES: Record<string, string> = {
  PENDING_BUNDLE: 'Flashbots working on including your swap',
  FAILED_BUNDLE: 'Failed',
  SUCCESSFUL_BUNDLE: 'Success',
  CANCEL_BUNDLE_SUCCESSFUL: 'Cancelled',
  BUNDLE_NOT_FOUND: 'Failed',
}

export enum Diagnosis {
  LOWER_THAN_TAIL = 'LOWER_THAN_TAIL',
  NOT_A_FLASHBLOCK = 'NOT_A_FLASHBLOCK',
  BUNDLE_OUTBID = 'BUNDLE_OUTBID',
  ERROR_API_BEHIND = 'ERROR_API_BEHIND',
  MISSING_BLOCK_DATA = 'MISSING_BLOCK_DATA',
  ERROR_UNKNOWN = 'ERROR_UNKNOWN',
}

export interface SocketSession {
  token: string
}

export interface TransactionReq {
  serialized: string // serialized transaction
  raw: SwapReq | undefined // raw def. of each type of trade
  estimatedGas?: number
  estimatedEffectiveGasPrice?: number
}

export interface TransactionProcessed {
  serialized: string // serialized transaction
  bundle: string // bundle.serialized
  raw: SwapReq | undefined // raw def. of each type of trade
  estimatedGas: number
  estimatedEffectiveGasPrice: number
}

export interface BundleReq {
  transactions: string[]
  chainId?: number
  bribe?: string // BigNumber
  from?: string
  deadline?: BigNumberish
  simulateOnly?: boolean
}

export interface SwapReq {
  amount0: BigNumberish
  amount1: BigNumberish
  path: Array<string>
  to: string
}

const serverUrl = (process.env.REACT_APP_SERVER_URL as string) || 'http://localhost:4000'

let socket: MistxSocket | null = null

export default function Sockets(): null {
  const dispatch = useDispatch()
  const addPopup = useAddPopup()
  const allTransactions = useAllTransactions()
  const frontrunningProtection = useFrontrunningProtection()
  const { chainId } = useActiveWeb3React()

  const shouldConnect: boolean = useMemo(() => {
    let hasPendingPrivateTx = false
    Object.keys(allTransactions).forEach((hash: string) => {
      const tx: TransactionDetails = allTransactions[hash]
      if (
        tx.privateTransaction &&
        tx.privateTransactionDetails &&
        tx.privateTransactionDetails.status === Status.PENDING_BUNDLE
      ) {
        hasPendingPrivateTx = true
      }
    })
    return hasPendingPrivateTx || frontrunningProtection
  }, [allTransactions, frontrunningProtection])

  useEffect(() => {
    let disconnect: () => void

    if (shouldConnect) {
      if (!socket) {
        socket = new MistxSocket(serverUrl)
      }
      disconnect = socket.init({
        onConnect: () => {
          console.log('websocket connected')
          // dispatch(updateSocketStatus(true))
        },
        onConnectError: (err) => {
          console.log('websocket connect error', err)
          // dispatch(updateSocketStatus(false))
        },
        onDisconnect: (err) => {
          console.log('websocket disconnect', err)
          // dispatch(updateSocketStatus(false))
        },
        onError: (err) => {
          console.log('websocket err', err)
          if (err.event === Event.MISTX_BUNDLE_REQUEST) {
            const bundleResponse = err.data as BundleRes
            const hash = bundleResponse.bundle.id

            if (allTransactions?.[hash]) {
              dispatch(
                removePrivateTransaction({
                  chainId: 1,
                  hash,
                })
              )
            }
          }
        },
        onFeesChange: (fees) => {
          dispatch(updatePrivateTransactionFees({ privateTransactionFees: fees }))
        },
        onTransactionResponse: (response) => {
          console.log('on tx response', response, chainId)
          const id = response.bundle.id
          const tx = allTransactions?.[id]
          console.log('id', id, allTransactions)
          const summary = tx?.summary
          // 0x7c5c7859d9cd920b4a7ffdbf8c3a50a13f9e89d23420910ce64b95fee7bab81d
          const hash = tx?.hash
          const previouslyCompleted =
            tx?.privateTransaction &&
            tx?.privateTransactionDetails &&
            tx?.privateTransactionDetails?.status !== Status.PENDING_BUNDLE &&
            tx?.receipt

          if (!hash || !chainId) return

          // TO DO - Handle response.status === BUNDLE_NOT_FOUND - ??
          if (!previouslyCompleted) {
            const txDetails: PrivateTransactionDetails = {
              bundle: {
                id: response.bundle.id,
                transactions: response.bundle.transactions as string[],
              },
              status: response.status,
              message: response.message,
              error: response.error,
              updatedAt: new Date().getTime(),
            }
            dispatch(
              updatePrivateTransaction({
                hash,
                chainId,
                privateTransactionDetails: txDetails,
              })
            )
            if (
              response.status === Status.SUCCESSFUL_BUNDLE ||
              response.status === Status.FAILED_BUNDLE ||
              response.status === Status.CANCEL_BUNDLE_SUCCESSFUL ||
              response.status === Status.BUNDLE_NOT_FOUND
            ) {
              addPopup(
                {
                  txn: {
                    hash,
                    success: response.status === Status.SUCCESSFUL_BUNDLE,
                    summary,
                    privateTransaction: true,
                    privateTransactionDetails: txDetails,
                  },
                },
                hash
              )
            }
          }
        },
      })
    } else if (socket) {
      socket.closeConnection()
      socket = null
    }

    return () => {
      if (disconnect) disconnect()
    }
  }, [addPopup, dispatch, allTransactions, shouldConnect, chainId])

  return null
}

export function emitTransactionRequest(bundle: BundleReq) {
  if (!socket) return
  socket.emitBundleRequest(bundle)
}

export function emitTransactionCancellation(id: string) {
  // TO DO any
  if (!socket) return
  socket.emitTransactionCancellation(id)
}
