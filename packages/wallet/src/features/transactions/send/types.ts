import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { GasEstimate } from '@universe/api'
import { AssetType, NFTAssetType } from 'uniswap/src/entities/assets'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface BaseSendParams {
  type: AssetType
  txId?: string
  account: SignerMnemonicAccountMeta
  chainId: UniverseChainId
  toAddress: Address
  tokenAddress: Address
  currencyAmountUSD?: Maybe<CurrencyAmount<Currency>> // for analytics
  gasEstimate?: GasEstimate
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
