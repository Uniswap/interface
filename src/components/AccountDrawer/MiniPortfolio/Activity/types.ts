import { Currency } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'

export type Activity = {
  hash: string
  chainId: SupportedChainId
  status: TransactionStatus
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
