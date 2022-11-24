import useSWR from 'swr'

import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useETHPrice } from 'state/application/hooks'

export enum GasLevel {
  SLOW = 'slow',
  NORMAL = 'normal',
  FAST = 'fast',
}

type Response = Array<{
  level: GasLevel
  front_tx_count: number
  price: number // in wei
  estimated_seconds: number
}>

type GasPriceTrackerData = Record<
  GasLevel,
  {
    gasPriceInGwei?: number
    minimumTxFeeInUSD?: string
  }
>

const calculateGasPrices = (resp: Response, currentPrice?: string | number): GasPriceTrackerData => {
  const levels = [GasLevel.SLOW, GasLevel.NORMAL, GasLevel.FAST]

  const gasPricesInWei = levels.map(level => resp.find(item => item.level === level)?.price)
  const gasPricesInGwei = gasPricesInWei.map(price => (price ? price / 1e9 : undefined))

  const parsedCurrentPrice = currentPrice ? Number.parseFloat(String(currentPrice)) : NaN

  const costs = gasPricesInWei.map(gasPrice => {
    if (!gasPrice || Number.isNaN(parsedCurrentPrice)) {
      return ''
    }
    // 190_000 is the minimum gas units needed for a swap
    const cost = ((gasPrice / 1e18) * parsedCurrentPrice * 190_000).toFixed(2)
    return cost
  })

  return {
    [GasLevel.SLOW]: {
      gasPriceInGwei: gasPricesInGwei[0],
      minimumTxFeeInUSD: costs[0],
    },
    [GasLevel.NORMAL]: {
      gasPriceInGwei: gasPricesInGwei[1],
      minimumTxFeeInUSD: costs[1],
    },
    [GasLevel.FAST]: {
      gasPriceInGwei: gasPricesInGwei[2],
      minimumTxFeeInUSD: costs[2],
    },
  }
}

const useGasPriceFromDeBank = (): GasPriceTrackerData | undefined => {
  const { chainId, networkInfo, isEVM } = useActiveWeb3React()
  const nativeTokenPriceData = useETHPrice()
  const chainSlug = isEVM ? (networkInfo as EVMNetworkInfo).deBankSlug : ''
  const { data, error } = useSWR<Response>(
    `https://openapi.debank.com/v1/wallet/gas_market?chain_id=${chainSlug}`,
    async (url: string) => {
      if (!isEVM) throw new Error()
      if (!chainSlug) {
        const err = `chain (${chainId}) is not supported`
        console.error(err)
        throw err
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data && Array.isArray(data)) {
          return data
        }

        const err = `invalid data in chain (${chainSlug})`
        console.error(err)
        throw err
      }

      const err = `fetching data on chain (${chainSlug}) failed`
      console.error(err)
      throw err
    },
  )

  if (error || !data) {
    return undefined
  }

  return calculateGasPrices(data, nativeTokenPriceData.currentPrice)
}

export default useGasPriceFromDeBank
