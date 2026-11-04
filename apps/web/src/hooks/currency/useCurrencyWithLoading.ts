import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfoWithLoading as useUniswapCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useCurrencyPreprocessing } from '~/hooks/currency/useCurrencyPreprocessing'

type Maybe<T> = T | undefined

export function useCurrencyWithLoading(
  { address, chainId }: { address?: string; chainId?: UniverseChainId },
  options?: { skip?: boolean },
): { currency: Maybe<Currency>; loading: boolean } {
  const { currencyInfo, loading } = useCurrencyInfoWithLoading(address, chainId, options?.skip)
  return { currency: currencyInfo?.currency, loading }
}

// oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
function useCurrencyInfoWithLoading(
  currency?: Currency,
  chainId?: UniverseChainId,
  skip?: boolean,
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean }
// oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
function useCurrencyInfoWithLoading(
  address?: string,
  chainId?: UniverseChainId,
  skip?: boolean,
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean }
// oxlint-disable-next-line max-params
function useCurrencyInfoWithLoading(
  addressOrCurrency?: string | Currency,
  chainId?: UniverseChainId,
  skip?: boolean,
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean } {
  const {
    currencyId,
    shouldSkip,
    addressOrCurrency: processedAddress,
  } = useCurrencyPreprocessing({ addressOrCurrency, chainId, skip })
  const { data: currencyInfo, isLoading } = useUniswapCurrencyInfoWithLoading(currencyId, { skip: shouldSkip })

  const finalCurrencyInfo = useMemo(() => {
    if (!currencyInfo || !processedAddress || skip) {
      return undefined
    }
    return currencyInfo
  }, [processedAddress, skip, currencyInfo])

  return { currencyInfo: finalCurrencyInfo, loading: isLoading }
}
