import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import type { ReactNode } from 'react'
import {
  TransactionOptions,
  TransactionStatus,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'

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
  currencies?: Array<Currency | undefined>
  /** Raw logo URLs for tokens that can't be resolved to a Currency (e.g. a just-launched token). Ignored when `currencies` is set. */
  logos?: Array<string | undefined>
  /** Placeholder symbols rendered when the corresponding `logos` entry is missing. */
  fallbackSymbols?: Array<string | undefined>
  otherAccount?: string
  from: string
  options?: TransactionOptions
  isUniswapX?: boolean
  isSpam?: boolean
}

export type ActivityMap = { [id: string]: Activity | undefined }
