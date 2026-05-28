import { usePrice } from '@universe/prices'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/defaults'
import { useTokenSpotPrice as useTokenSpotPriceLegacy } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { isPriceServiceSupportedChain } from 'uniswap/src/features/prices/isPriceServiceSupportedChain'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

export function useTokenSpotPriceCentralized(currencyId: CurrencyId | undefined): number | undefined {
  const chainId = currencyId ? (currencyIdToChain(currencyId) ?? undefined) : undefined
  const rawAddress = currencyId ? currencyIdToAddress(currencyId) : undefined

  // Normalize legacy native address (0xeeee...) to the format the price service expects (0x0000...)
  const address =
    chainId !== undefined && isNativeCurrencyAddress(chainId, rawAddress) ? DEFAULT_NATIVE_ADDRESS : rawAddress

  const isSupported = chainId !== undefined && isPriceServiceSupportedChain(chainId)

  // Centralized: no-ops when !isSupported (usePrice skips via enabled=false)
  const centralizedPrice = usePrice({
    chainId: isSupported ? chainId : undefined,
    address: isSupported ? address : undefined,
  })

  // Legacy fallback: Apollo fragment cache reads — no network, always cheap
  const legacyPrice = useTokenSpotPriceLegacy(currencyId)

  return isSupported ? centralizedPrice : legacyPrice
}
