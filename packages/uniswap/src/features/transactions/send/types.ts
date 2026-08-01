import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { BaseDerivedInfo } from 'uniswap/src/features/transactions/types/baseDerivedInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

export type DerivedSendInfo = BaseDerivedInfo<CurrencyInfo | NFTItem> & {
  currencyTypes: { [CurrencyField.INPUT]?: AssetType }
  currencyInInfo?: CurrencyInfo | null
  chainId: UniverseChainId
  exactAmountFiat: string
  exactCurrencyField: CurrencyField.INPUT
  isFiatInput?: boolean
  nftIn: NFTItem | undefined
  recipient?: string
  txId?: string
}
