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
  currencies?: Array<Currency>
  otherAccount?: string
  receipt?: Receipt
}

export type ActivityMap = { [hash: string]: Activity | undefined }
