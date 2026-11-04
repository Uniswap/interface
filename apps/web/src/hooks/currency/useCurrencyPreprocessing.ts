import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useAccount } from '~/connection/hooks/useAccount'
import { checkIsNative } from '~/utils/checkIsNative'

// Extract the common preprocessing logic
export function useCurrencyPreprocessing({
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
