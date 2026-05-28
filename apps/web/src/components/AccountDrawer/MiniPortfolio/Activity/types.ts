import type { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import type { ReactNode } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOptions,
  TransactionStatus,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * TODO: refactor parsing / Activity so that all Activity Types can have a detail sheet.
 */

export type Activity = {
  id: string
  hash?: string
  chainId: UniverseChainId
  outputChainId?: UniverseChainId
  status: TransactionStatus
  offchainOrderDetails?: UniswapXOrderDetails
  statusMessage?: string
  timestamp: number
  title: string
  descriptor?: string | JSX.Element
  portfolioLogoCustomIcon?: ReactNode
  // TODO(WEB-3839): replace Currency with CurrencyInfo
  currencies?: Array<Currency | undefined>
  otherAccount?: string
  from: string
  options?: TransactionOptions
  isUniswapX?: boolean
  isSpam?: boolean
  type?: GraphQLApi.TransactionType
}

export type ActivityMap = { [id: string]: Activity | undefined }
