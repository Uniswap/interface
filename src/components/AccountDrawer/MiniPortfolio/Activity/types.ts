import { ChainId, Currency } from '@uniswap/sdk-core'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'

export type Activity = {
  hash: string
  chainId: ChainId
  status: TransactionStatus
  // TODO (UniswapX): decouple Activity from UniswapXOrderStatus once we can link UniswapXScan instead of needing data for modal
  offchainOrderStatus?: UniswapXOrderStatus
  statusMessage?: string
  timestamp: number
  title: string
  descriptor?: string
  logos?: Array<string | undefined>
  currencies?: Array<Currency | undefined>
  otherAccount?: string
  from: string
  nonce?: number | null
  prefixIconSrc?: string
}

export type ActivityMap = { [id: string]: Activity | undefined }
