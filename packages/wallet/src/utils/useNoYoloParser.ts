import { JsonRpcProvider } from '@ethersproject/providers'
import { ExplorerAbiFetcher, Parser, ProxyAbiFetcher } from 'no-yolo-signatures'
import { useMemo } from 'react'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { RPCType, WalletChainId } from 'uniswap/src/types/chains'

export function useNoYoloParser(chainId: WalletChainId): Parser {
  const parser = useMemo(() => {
    const rpcUrls = UNIVERSE_CHAIN_INFO[chainId].rpcUrls
    const apiURL = UNIVERSE_CHAIN_INFO[chainId].explorer.apiURL || ''

    const explorerAbiFetcher = new ExplorerAbiFetcher(apiURL)

    const rpcUrl =
      rpcUrls?.appOnly?.http[0] ||
      rpcUrls?.default?.http[0] ||
      rpcUrls?.[RPCType.Public]?.http[0] ||
      rpcUrls?.[RPCType.PublicAlt]?.http[0]
    const provider = new JsonRpcProvider(rpcUrl)

    const proxyAbiFetcher = new ProxyAbiFetcher(provider, [explorerAbiFetcher])

    return new Parser({ abiFetchers: [proxyAbiFetcher, explorerAbiFetcher] })
  }, [chainId])

  return parser
}
