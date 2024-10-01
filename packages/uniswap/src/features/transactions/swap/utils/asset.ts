import { Currency } from '@uniswap/sdk-core'
import { AssetType, CurrencyAsset } from 'uniswap/src/entities/assets'
import { currencyAddress } from 'uniswap/src/utils/currencyId'

export const currencyToAsset = (currency: Currency | undefined): CurrencyAsset | null => {
  if (!currency) {
    return null
  }

  return {
    address: currencyAddress(currency),
    chainId: currency.chainId,
    type: AssetType.Currency,
  }
}
