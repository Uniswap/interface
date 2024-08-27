import { FiatPurchaseTransactionInfo, TransactionDetails } from 'wallet/src/features/transactions/types'

export type FiatOnRampTransactionDetails = TransactionDetails & {
  typeInfo: FiatPurchaseTransactionInfo
}

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#currencies */
export type MoonpayCurrency = {
  id: string
  type: 'crypto' | 'fiat'
  name?: string
  code: string
  supportsTestMode: boolean
  supportsLiveMode: boolean
  notAllowedUSStates: string[]
  isSupportedInUS: boolean
  metadata?: {
    contractAddress: string
    chainId: string
  }
}
