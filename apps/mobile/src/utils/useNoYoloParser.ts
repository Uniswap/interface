import { getAbiFetchersForChainId, Parser } from 'no-yolo-signatures'
import { useMemo } from 'react'
import { config } from 'uniswap/src/config'
import { ChainId } from 'wallet/src/constants/chains'

export function useNoYoloParser(chainId: ChainId): Parser {
  const parser = useMemo(() => {
    // TODO: [MOB-1] use better ABI Fetchers and/or our own Infura nodes for all chains.
    const abiFetchers = getAbiFetchersForChainId(chainId, {
      rpcUrls: {
        [ChainId.Mainnet]: `https://mainnet.infura.io/v3/${config.infuraProjectId}`,
      },
    })
    return new Parser({ abiFetchers })
  }, [chainId])

  return parser
}
