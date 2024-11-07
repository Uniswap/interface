import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { AssetType, NFTAssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface BaseSendParams {
  type: AssetType
  txId?: string
  account: Account
  chainId: UniverseChainId
  toAddress: Address
  tokenAddress: Address
  currencyAmountUSD?: Maybe<CurrencyAmount<Currency>> // for analytics
  gasEstimates?: GasFeeEstimates
}

export interface SendCurrencyParams extends BaseSendParams {
  type: AssetType.Currency
  amountInWei: string
}

export interface SendNFTParams extends BaseSendParams {
  type: NFTAssetType
  tokenId: string
}

export type SendTokenParams = SendCurrencyParams | SendNFTParams
