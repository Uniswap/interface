import { useEffect, useState } from 'react'
import { useActiveWeb3React } from '.'
import { ChainId } from '@swapr/sdk'
import { INFURA_PROJECT_ID } from '../connectors'

interface ChainGasInfo {
  [chainId: number]: {
    url: string
    requestConfig?: RequestInit
    keys?: string[]
  }
}

const gasInfoChainUrls: ChainGasInfo = {
  [ChainId.MAINNET]: {
    url: 'http://ethgas.watch/api/gas',
    keys: ['normal', 'fast', 'slow']
  },
  [ChainId.XDAI]: {
    url: 'https://blockscout.com/xdai/mainnet/api/v1/gas-price-oracle',
    keys: ['average', 'fast', 'slow']
  },
  [ChainId.ARBITRUM_ONE]: {
    url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    requestConfig: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1
      })
    }
  }
}

interface Gas {
  fast: number
  normal: number
  slow: number
}

const defaultGasState: Gas = {
  fast: 0,
  normal: 0,
  slow: 0
}

/**
 * Fetches and return gas price information for the current active chain
 * @returns Gas prices
 */
export function useGasInfo(): { loading: boolean; gas: Gas } {
  const { chainId } = useActiveWeb3React()
  const [loading, setLoading] = useState<boolean>(true)
  const [gas, setGas] = useState<Gas>(defaultGasState)

  useEffect(() => {
    if (!chainId || !gasInfoChainUrls[chainId]) {
      setLoading(false)
      setGas(defaultGasState)
      return
    }

    // Fetch gas price data
    const chainGasInfo = gasInfoChainUrls[chainId]

    fetch(chainGasInfo.url, chainGasInfo.requestConfig)
      .then(res => res.json())
      .then(data => {
        // Default gas prices
        let { normal, slow, fast } = defaultGasState

        // Mainnet and xDAI uses external API
        if (chainId === ChainId.MAINNET || chainId === ChainId.XDAI) {
          const keys = chainGasInfo.keys!
          // Pick the keys
          const gasNormalData = data[keys[0]]
          const gasFastData = data[keys[1]]
          const gasSlowData = data[keys[2]]
          // ethgas.watch returns both USD and Gwei units
          if (chainId === ChainId.MAINNET) {
            normal = gasNormalData.gwei
            fast = gasFastData.gwei
            slow = gasSlowData.gwei
          } else {
            normal = gasNormalData
            fast = gasFastData
            slow = gasSlowData
          }
        } else {
          // On Arbitrum (and other L2's), parse Gwei to decimal and round the number
          // There is no fast nor slow gas prices
          normal = parseFloat((parseInt(data.result, 16) / 1e9).toFixed(2))
        }
        console.log(typeof normal, fast, slow)
        // Update state
        setGas({ normal, fast, slow })
      })
      .catch(e => {
        console.error('useGasInfo error: ', e)
        setGas(defaultGasState)
      })
      .finally(() => setLoading(false))
  }, [chainId])

  return {
    loading,
    gas
  }
}
