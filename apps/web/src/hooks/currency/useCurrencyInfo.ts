import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo as useUniswapCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useCurrencyPreprocessing } from '~/hooks/currency/useCurrencyPreprocessing'

type Maybe<T> = T | undefined

/**
 * @deprecated useCurrencyInfo from packages/uniswap instead
 * Returns a CurrencyInfo from the tokenAddress+chainId pair.
 */
// oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
export function useCurrencyInfo(currency?: Currency, chainId?: UniverseChainId, skip?: boolean): Maybe<CurrencyInfo>
// oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
export function useCurrencyInfo(address?: string, chainId?: UniverseChainId, skip?: boolean): Maybe<CurrencyInfo>
// oxlint-disable-next-line max-params
export function useCurrencyInfo(
  addressOrCurrency?: string | Currency,
  chainId?: UniverseChainId,
  skip?: boolean,
): Maybe<CurrencyInfo> {
  const {
    currencyId,
    shouldSkip,
    addressOrCurrency: processedAddress,
  } = useCurrencyPreprocessing({ addressOrCurrency, chainId, skip })
  const currencyInfo = useUniswapCurrencyInfo(currencyId, { skip: shouldSkip })

  return useMemo(() => {
    if (!currencyInfo || !processedAddress || skip) {
      return undefined
    }
    return currencyInfo
  }, [processedAddress, skip, currencyInfo])
}
