import { ChainId, Currency } from '@uniswap/sdk-core'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { UniswapXOrderDetails } from 'state/signatures/types'

/**
 * TODO: refactor parsing / Activity so that all Activity Types can have a detail sheet.
 */

export type Activity = {
  hash: string
  chainId: ChainId
  status: TransactionStatus
  offchainOrderDetails?: UniswapXOrderDetails
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
  cancelled?: boolean
  isSpam?: boolean
}

export type ActivityMap = { [id: string]: Activity | undefined }
