import { Currency } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { AssetActivityPartsFragment, TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'

type Receipt = AssetActivityPartsFragment['transaction']

export type Activity = {
  hash: string
  chainId: SupportedChainId
  status: TransactionStatus
  timestamp: number
  title: string
  descriptor?: string
  logos?: Array<string | undefined>
  currencies?: Array<Currency | undefined>
  otherAccount?: string
  receipt?: Omit<Receipt, 'nonce'>
  nonce?: number | null
}

export type ActivityMap = { [hash: string]: Activity | undefined }
