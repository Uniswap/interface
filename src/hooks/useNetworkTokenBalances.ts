import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { gql } from 'graphql-request'
import { useEffect, useState } from 'react'

type NetworkTokenBalancesMap = Partial<Record<SupportedChainId, CurrencyAmount<Token>>>

interface useNetworkTokenBalancesResult {
  data: NetworkTokenBalancesMap | null
  error: null | string
  loading: boolean
}

interface useNetworkTokenBalancesArgs {
  address: string | undefined
}

export function useNetworkTokenBalances({ address }: useNetworkTokenBalancesArgs): useNetworkTokenBalancesResult {
  const [data, setData] = useState<NetworkTokenBalancesMap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const query = gql``

  useEffect(() => {
    if (address) {
      const FAKE_TOKEN_NETWORK_BALANCES = {
        [SupportedChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(
          new Token(SupportedChainId.ARBITRUM_ONE, address, 18),
          10e18
        ),
        [SupportedChainId.MAINNET]: CurrencyAmount.fromRawAmount(
          new Token(SupportedChainId.MAINNET, address, 18),
          1e18
        ),
        [SupportedChainId.RINKEBY]: CurrencyAmount.fromRawAmount(
          new Token(SupportedChainId.RINKEBY, address, 9),
          10e18
        ),
      }

      const fetchNetworkTokenBalances = async (address: string): Promise<NetworkTokenBalancesMap | void> => {
        const waitRandom = (min: number, max: number): Promise<void> =>
          new Promise((resolve) => setTimeout(resolve, min + Math.round(Math.random() * Math.max(0, max - min))))
        try {
          console.log('useNetworkTokenBalances.fetchNetworkTokenBalances', query)
          setLoading(true)
          setError(null)
          console.log('useNetworkTokenBalances.fetchNetworkTokenBalances', address)
          await waitRandom(250, 2000)
          if (Math.random() < 0.05) {
            throw new Error('fake error')
          }
          return FAKE_TOKEN_NETWORK_BALANCES
        } catch (e) {
          setError('something went wrong')
        } finally {
          setLoading(false)
        }
      }
      setLoading(true)
      setError(null)
      fetchNetworkTokenBalances(address)
        .then((data) => {
          if (data) setData(data)
        })
        .catch((e) => setError(e))
        .finally(() => setLoading(false))
    } else {
      setData(null)
    }
  }, [address, query])

  return {
    data,
    error,
    loading,
  }
}
