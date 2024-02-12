import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType, NFTAssetType } from 'wallet/src/entities/assets'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { GQLNftAsset } from 'wallet/src/features/nfts/hooks'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface BaseTransferParams {
  type: AssetType
  txId?: string
  account: Account
  chainId: ChainId
  toAddress: Address
  tokenAddress: Address
}

export interface TransferCurrencyParams extends BaseTransferParams {
  type: AssetType.Currency
  amountInWei: string
}

export interface TransferNFTParams extends BaseTransferParams {
  type: NFTAssetType
  tokenId: string
}

export type TransferTokenParams = TransferCurrencyParams | TransferNFTParams

export type BaseDerivedInfo<TInput = CurrencyInfo> = {
  currencies: {
    [CurrencyField.INPUT]: Maybe<TInput>
  }
  currencyAmounts: {
    [CurrencyField.INPUT]: Maybe<CurrencyAmount<Currency>>
  }
  currencyBalances: {
    [CurrencyField.INPUT]: Maybe<CurrencyAmount<Currency>>
  }
  exactAmountFiat?: string
  exactAmountToken: string
  exactCurrencyField: CurrencyField
}

export type DerivedTransferInfo = BaseDerivedInfo<CurrencyInfo | GQLNftAsset> & {
  currencyTypes: { [CurrencyField.INPUT]?: AssetType }
  currencyInInfo?: CurrencyInfo | null
  chainId: ChainId
  exactAmountFiat: string
  exactCurrencyField: CurrencyField.INPUT
  isFiatInput?: boolean
  nftIn: GQLNftAsset | undefined
  recipient?: string
  txId?: string
}

export interface TransferSpeedbump {
  hasWarning: boolean
  loading: boolean
}

export enum TokenSelectorFlow {
  Swap,
  Transfer,
}
