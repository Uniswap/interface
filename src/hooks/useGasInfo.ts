import { useEffect, useState } from 'react'
import { useActiveWeb3React } from '.'
import { ChainId } from '@swapr/sdk'
import { INFURA_PROJECT_ID } from '../connectors'

const gasInfoChainUrls: {
  [chainId: number]: { url: string; body?: any; objectDestrucutre?: any; deepDestrucuture?: string }
} = {
  [ChainId.MAINNET]: {
    url: 'http://ethgas.watch/api/gas',
    objectDestrucutre: ['normal', 'fast', 'slow']
  },
  [ChainId.XDAI]: {
    url: 'https://blockscout.com/xdai/mainnet/api/v1/gas-price-oracle',
    objectDestrucutre: ['average', 'fast', 'slow']
  },
  [ChainId.ARBITRUM_ONE]: {
    url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    body: {
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
export function useGasInfo(): { loading: boolean; gas: { fast: number; normal: number; slow: number } } {
  const { chainId } = useActiveWeb3React()
  const [loading, setLoading] = useState<boolean>(true)
  const [gas, setGas] = useState<{ fast: number; normal: number; slow: number }>({ normal: 0, fast: 0, slow: 0 })
  console.log(gasInfoChainUrls)
  useEffect(() => {
    // if (loadingNativeCurrencyUSDPrice) return { loading: true, gasFeesUSD: [] }
    if (!chainId) {
      setLoading(true)
      setGas({ normal: 0, fast: 0, slow: 0 })
    } else {
      fetch(gasInfoChainUrls[chainId].url, gasInfoChainUrls[chainId].body)
        .then(res => res.json())
        .then(data => {
          console.log(data)
          let average
          let fast = 0
          let slow = 0
          if (chainId === ChainId.MAINNET) {
            average = data[gasInfoChainUrls[chainId].objectDestrucutre[0]].gwei
            fast = data[gasInfoChainUrls[chainId].objectDestrucutre[1]].gwei
            slow = data[gasInfoChainUrls[chainId].objectDestrucutre[2]].gwei
          } else if (chainId === ChainId.XDAI) {
            average = data[gasInfoChainUrls[chainId].objectDestrucutre[0]]
            fast = data[gasInfoChainUrls[chainId].objectDestrucutre[1]]
            slow = data[gasInfoChainUrls[chainId].objectDestrucutre[2]]
          } else {
            average = (parseInt(data.result, 16) / 1e9).toFixed(3)
          }

          setLoading(false)
          setGas({ normal: average, fast: fast, slow: slow })
        })
        .catch(e => {
          console.error('gasInfo error: ', e)
          setLoading(true)
          setGas({ normal: 0, fast: 0, slow: 0 })
        })
    }
  }, [chainId])
  return { loading, gas }
}
