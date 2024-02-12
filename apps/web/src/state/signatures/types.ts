import { UniswapXOrderStatus } from 'lib/hooks/orders/types'

import { ExactInputSwapTransactionInfo, ExactOutputSwapTransactionInfo } from '../transactions/types'

export enum SignatureType {
  SIGN_UNISWAPX_ORDER = 'signUniswapXOrder',
  SIGN_LIMIT = 'signLimit',
}

interface BaseSignatureFields {
  type: SignatureType
  id: string
  addedTime: number
  chainId: number
  expiry?: number
  offerer: string
}

export interface UniswapXOrderDetails extends BaseSignatureFields {
  type: SignatureType
  orderHash: string
  status: UniswapXOrderStatus
  swapInfo: (ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo) & { isUniswapXOrder: true }
  txHash?: string
  encodedOrder?: string
}

export type SignatureDetails = UniswapXOrderDetails
