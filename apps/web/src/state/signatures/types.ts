import { SupportedInterfaceChainId } from 'constants/chains'
import { UniswapXOrderStatus } from 'types/uniswapx'
import {
  AssetActivityPartsFragment,
  SwapOrderDetailsPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ExactInputSwapTransactionInfo, ExactOutputSwapTransactionInfo } from '../transactions/types'

export type OrderActivity = AssetActivityPartsFragment & { details: SwapOrderDetailsPartsFragment }

export enum SignatureType {
  SIGN_UNISWAPX_ORDER = 'signUniswapXOrder',
  SIGN_UNISWAPX_V2_ORDER = 'signUniswapXV2Order',
  SIGN_LIMIT = 'signLimit',
}

interface BaseSignatureFields {
  type?: SignatureType
  id: string
  addedTime: number
  chainId: SupportedInterfaceChainId
  expiry?: number
  offerer: string
}

/**
 * `UniswapXOrderDetails` is used for both submitting orders and fetching order details.
 * - `type` is required for order submission; marked as optional due to the difficulty in distinguishing between X v1 & v2 orders when fetching details from on-chain data
 * - `encodedOrder` is required for order submission; marked is optional as it's not returned by the GQL TransactionDetails schema when fetching order details
 * - `txHash` is marked as optional because it's only present for orders that have been filled onchain. OrderHash !== TxHash
 */
export interface UniswapXOrderDetails extends BaseSignatureFields {
  orderHash: string
  type?: SignatureType
  status: UniswapXOrderStatus
  swapInfo: (ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo) & { isUniswapXOrder: true }
  txHash?: string
  encodedOrder?: string
}

export type SignatureDetails = UniswapXOrderDetails
