import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { currencyAddress } from 'uniswap/src/utils/currencyId'

/** Every (chainId,address) an option resolves to (one for Token, N for MultichainToken). */
export function optionChainAddresses(option: SearchModalOption): { chainId: number; address: string }[] {
  switch (option.type) {
    case OnchainItemListOptionType.Token:
      return [{ chainId: option.currencyInfo.currency.chainId, address: currencyAddress(option.currencyInfo.currency) }]
    case OnchainItemListOptionType.MultichainToken:
      return option.multichainResult.tokens.map((t) => ({
        chainId: t.currency.chainId,
        address: currencyAddress(t.currency),
      }))
    default:
      return []
  }
}
