import { CurrencyAmount, USD } from '@swapr/sdk'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { MainnetGasPrice } from '../state/application/actions'
import { useMainnetGasPrices } from '../state/application/hooks'
import { useUserPreferredGasPrice } from '../state/user/hooks'
import { useNativeCurrencyUSDPrice } from './useNativeCurrencyUSDPrice'

export function useGasFeesUSD(
  gasEstimations: (BigNumber | null)[]
): { loading: boolean; gasFeesUSD: (CurrencyAmount | null)[] } {
  const { chainId } = useActiveWeb3React()
  const mainnetGasPrices = useMainnetGasPrices()
  const [preferredGasPrice] = useUserPreferredGasPrice()
  const { loading: loadingNativeCurrencyUSDPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  return useMemo(() => {
    if (loadingNativeCurrencyUSDPrice) return { loading: true, gasFeesUSD: [] }
    if (
      !gasEstimations ||
      gasEstimations.length === 0 ||
      !preferredGasPrice ||
      !chainId ||
      (preferredGasPrice in MainnetGasPrice && !mainnetGasPrices)
    )
      return { loading: false, gasFeesUSD: [] }
    const normalizedPreferredGasPrice =
      mainnetGasPrices && preferredGasPrice in MainnetGasPrice
        ? mainnetGasPrices[preferredGasPrice as MainnetGasPrice]
        : preferredGasPrice
    // protects cases in which mainnet gas prices is undefined but
    // preferred gas price remained set to INSTANT, FAST or NORMAL
    if (Number.isNaN(normalizedPreferredGasPrice)) return { loading: false, gasFeesUSD: [] }
    return {
      loading: false,
      gasFeesUSD: gasEstimations.map(gasEstimation => {
        if (!gasEstimation) return null
        const nativeCurrencyAmount = CurrencyAmount.nativeCurrency(
          gasEstimation.mul(normalizedPreferredGasPrice).toString(),
          chainId
        )
        return CurrencyAmount.usd(
          parseUnits(
            nativeCurrencyAmount.multiply(nativeCurrencyUSDPrice).toFixed(USD.decimals),
            USD.decimals
          ).toString()
        )
      })
    }
  }, [
    gasEstimations,
    loadingNativeCurrencyUSDPrice,
    mainnetGasPrices,
    nativeCurrencyUSDPrice,
    preferredGasPrice,
    chainId
  ])
}
