import { formatEther } from '@ethersproject/units'
import { ChainId } from '@ubeswap/sdk-core'
import { useUSDPrice } from 'hooks/useUSDPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { GenieAsset } from 'nft/types'

export const useNativeUsdPrice = (chainId: number = ChainId.CELO): number => {
  const nativeCurrency = useNativeCurrency(chainId)
  const parsedAmount = tryParseCurrencyAmount('1', nativeCurrency)
  const usdcValue = useUSDPrice(parsedAmount)?.data ?? 0
  return usdcValue
}

export function useUsdPriceofNftAsset(asset: GenieAsset): string | undefined {
  const fetchedPriceData = useNativeUsdPrice()

  return fetchedPriceData && asset?.priceInfo?.ETHPrice
    ? (parseFloat(formatEther(asset?.priceInfo?.ETHPrice)) * fetchedPriceData).toString()
    : ''
}
