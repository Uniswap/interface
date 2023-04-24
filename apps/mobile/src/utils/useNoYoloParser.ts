import { getAbiFetchersForChainId, Parser } from 'no-yolo-signatures'
import { useMemo } from 'react'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'

export function useNoYoloParser(chainId: ChainId): Parser {
  const parser = useMemo(() => {
    // TODO: [MOB-178] use better ABI Fetchers and/or our own Infura nodes for all chains.
    const abiFetchers = getAbiFetchersForChainId(chainId, {
      rpcUrls: {
        [ChainId.Mainnet]: `https://mainnet.infura.io/v3/${config.infuraProjectId}`,
      },
    })
    return new Parser({ abiFetchers })
  }, [chainId])

  return parser
}
