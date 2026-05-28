import { Currency } from '@uniswap/sdk-core'
import { UniswapXOrderDetails } from 'state/signatures/types'
import {
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * TODO: refactor parsing / Activity so that all Activity Types can have a detail sheet.
 */

export type Activity = {
  hash: string
  chainId: UniverseChainId
  outputChainId?: UniverseChainId
  status: TransactionStatus
  offchainOrderDetails?: UniswapXOrderDetails
  statusMessage?: string
  timestamp: number
  title: string
  descriptor?: string | JSX.Element
  logos?: Array<string | undefined>
  // TODO(WEB-3839): replace Currency with CurrencyInfo
  currencies?: Array<Currency | undefined>
  otherAccount?: string
  from: string
  nonce?: number | null
  prefixIconSrc?: string
  suffixIconSrc?: string
  cancelled?: boolean
  isSpam?: boolean
  type?: TransactionType
}

export type ActivityMap = { [id: string]: Activity | undefined }
