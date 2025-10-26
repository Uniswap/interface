import { Currency, Token } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  useCurrencyInfo as useUniswapCurrencyInfo,
  useCurrencyInfoWithLoading as useUniswapCurrencyInfoWithLoading,
} from 'uniswap/src/features/tokens/useCurrencyInfo'
import { AddressStringFormat, getValidAddress, normalizeAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

type Maybe<T> = T | undefined

// Extract the common preprocessing logic
function useCurrencyPreprocessing({
  addressOrCurrency,
  chainId,
  skip,
}: {
  addressOrCurrency?: string | Currency
  chainId?: UniverseChainId
  skip?: boolean
}) {
  const { chainId: connectedChainId } = useAccount()
  const chainIdWithFallback =
    (typeof addressOrCurrency === 'string' ? chainId : addressOrCurrency?.chainId) ?? connectedChainId
  const supportedChainId = useSupportedChainId(chainIdWithFallback)
  const nativeAddressWithFallback = getChainInfo(supportedChainId ?? UniverseChainId.Mainnet).nativeCurrency.address

  const isNative = useMemo(() => checkIsNative(addressOrCurrency), [addressOrCurrency])
  const address = useMemo(
    () => getAddress({ isNative, nativeAddressWithFallback, addressOrCurrency }),
    [isNative, nativeAddressWithFallback, addressOrCurrency],
  )

  const addressWithFallback = isNative || !address ? nativeAddressWithFallback : address
  const currencyId = buildCurrencyId(supportedChainId ?? UniverseChainId.Mainnet, addressWithFallback)
  const shouldSkip = !addressOrCurrency || skip

  return { currencyId, shouldSkip, addressOrCurrency }
}

export function useCurrency({ address, chainId }: { address?: string; chainId?: UniverseChainId }): Maybe<Currency> {
  const currencyInfo = useCurrencyInfo(address, chainId, false)
  return currencyInfo?.currency
}

export function useCurrencyWithLoading(
  { address, chainId }: { address?: string; chainId?: UniverseChainId },
  options?: { skip?: boolean },
): { currency: Maybe<Currency>; loading: boolean } {
  const { currencyInfo, loading } = useCurrencyInfoWithLoading(address, chainId, options?.skip)
  return { currency: currencyInfo?.currency, loading }
}

/**
 * @deprecated useCurrencyInfo from packages/uniswap instead
 * Returns a CurrencyInfo from the tokenAddress+chainId pair.
 */
export function useCurrencyInfo(currency?: Currency, chainId?: UniverseChainId, skip?: boolean): Maybe<CurrencyInfo>
export function useCurrencyInfo(address?: string, chainId?: UniverseChainId, skip?: boolean): Maybe<CurrencyInfo>
// eslint-disable-next-line max-params
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

function useCurrencyInfoWithLoading(
  currency?: Currency,
  chainId?: UniverseChainId,
  skip?: boolean,
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean }
function useCurrencyInfoWithLoading(
  address?: string,
  chainId?: UniverseChainId,
  skip?: boolean,
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean }
// eslint-disable-next-line max-params
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
  const { currencyInfo, loading } = useUniswapCurrencyInfoWithLoading(currencyId, { skip: shouldSkip })

  const finalCurrencyInfo = useMemo(() => {
    if (!currencyInfo || !processedAddress || skip) {
      return undefined
    }
    return currencyInfo
  }, [processedAddress, skip, currencyInfo])

  return { currencyInfo: finalCurrencyInfo, loading }
}

export function checkIsNative(addressOrCurrency?: string | Currency): boolean {
  return typeof addressOrCurrency === 'string'
    ? [NATIVE_CHAIN_ID, 'native', 'eth'].includes(normalizeAddress(addressOrCurrency, AddressStringFormat.Lowercase))
    : (addressOrCurrency?.isNative ?? false)
}

function getAddress({
  isNative,
  nativeAddressWithFallback,
  addressOrCurrency,
}: {
  isNative: boolean
  nativeAddressWithFallback: string
  addressOrCurrency?: string | Currency
}): string | undefined {
  if (typeof addressOrCurrency === 'string') {
    if (isNative) {
      return nativeAddressWithFallback
    } else {
      return addressOrCurrency
    }
  }

  if (addressOrCurrency) {
    if (addressOrCurrency.isNative) {
      return nativeAddressWithFallback
    } else {
      return addressOrCurrency.address
    }
  }

  return undefined
}

export function useToken(tokenAddress?: string, chainId?: UniverseChainId): Maybe<Token> {
  const { chainId: connectedChainId } = useAccount()

  const formattedAddress = getValidAddress({
    address: tokenAddress,
    chainId: chainId ?? connectedChainId ?? UniverseChainId.Mainnet,
    withEVMChecksum: true,
  })
  const currency = useCurrency({
    address: formattedAddress ? formattedAddress : undefined,
    chainId: chainId ?? connectedChainId,
  })

  return useMemo(() => {
    if (currency && currency.isToken) {
      return currency
    }
    return undefined
  }, [currency])
}
