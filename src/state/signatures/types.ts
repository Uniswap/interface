import { ExactInputSwapTransactionInfo, ExactOutputSwapTransactionInfo } from '../transactions/types'

export enum DutchOrderStatus {
  OPEN = 'OPEN',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED',
  FILLED = 'FILLED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
}

export enum SignatureType {
  SIGN_UNISWAPX_ORDER = 'signUniswapXOrder',
  PLACEHOLDER = 'placeholder',
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
  status: DutchOrderStatus
  swapInfo: (ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo) & { isUniswapXOrder: true }
  txHash?: string
}

// Used to enforce discriminating the SignatureDetails union until we have more than one SignatureDetails implementation
interface PlaceholderSignatureDetails extends BaseSignatureFields {
  type: SignatureType.PLACEHOLDER
}

export type SignatureDetails = UniswapXOrderDetails | PlaceholderSignatureDetails
