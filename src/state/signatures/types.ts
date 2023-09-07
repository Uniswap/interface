import { ExactInputSwapTransactionInfo, ExactOutputSwapTransactionInfo } from '../transactions/types'

export enum SignatureType {
  SIGN_UNISWAPX_ORDER = 'signUniswapXOrder',
}

interface BaseSignatureFields {
  type: SignatureType
  id: string
  addedTime: number
  chainId: number
  expiry: number
  offerer: string
}

export interface UniswapXOrderDetails extends BaseSignatureFields {
  type: SignatureType.SIGN_UNISWAPX_ORDER
  orderHash: string
  status: undefined
  swapInfo: (ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo) & { isUniswapXOrder: true }
  txHash?: string
}

export type SignatureDetails = UniswapXOrderDetails
