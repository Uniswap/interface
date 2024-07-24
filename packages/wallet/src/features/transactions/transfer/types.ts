import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { AssetType, NFTAssetType } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { GQLNftAsset } from 'wallet/src/features/nfts/hooks'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface BaseTransferParams {
  type: AssetType
  txId?: string
  account: Account
  chainId: WalletChainId
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
  chainId: WalletChainId
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
