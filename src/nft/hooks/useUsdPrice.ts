import { formatEther } from '@ethersproject/units'
import { ChainId } from '@uniswap/sdk-core'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { GenieAsset } from 'nft/types'

export const useNativeUsdPrice = (chainId: number = ChainId.MAINNET): number => {
  const nativeCurrency = useNativeCurrency(chainId)
  const parsedAmount = tryParseCurrencyAmount('1', nativeCurrency)
  const usdcValue = useStablecoinValue(parsedAmount)?.toExact()
  const usdPrice = parseFloat(usdcValue ?? '')
  return usdPrice
}

export function useUsdPrice(asset: GenieAsset): string | undefined {
  const fetchedPriceData = useNativeUsdPrice()

  return fetchedPriceData && asset?.priceInfo?.ETHPrice
    ? (parseFloat(formatEther(asset?.priceInfo?.ETHPrice)) * fetchedPriceData).toString()
    : ''
}
