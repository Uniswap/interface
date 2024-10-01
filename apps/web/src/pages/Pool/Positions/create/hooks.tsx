import { useAccount } from 'hooks/useAccount'
import { PositionInfo, PositionState } from 'pages/Pool/Positions/create/types'
import { useMemo } from 'react'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/types/chains'

export function useDerivedPositionInfo(state: PositionState): PositionInfo {
  const { chainId } = useAccount()
  const tokens = [
    state.tokenInputs.TOKEN0?.isNative ? state.tokenInputs.TOKEN0.wrapped : state.tokenInputs.TOKEN0,
    state.tokenInputs.TOKEN1?.isNative ? state.tokenInputs.TOKEN1.wrapped : state.tokenInputs.TOKEN1,
  ]
  const sortedTokens = tokens.sort((a, b) => (!b ? -1 : a?.sortsBefore(b) ? -1 : 1))
  const { data } = useGetPoolsByTokens({
    fee: state.fee,
    chainId: chainId ?? (UniverseChainId.Mainnet as number),
    protocolVersions: [state.protocolVersion],
    token0: sortedTokens[0]?.address,
    token1: sortedTokens[1]?.address,
  })

  return useMemo(
    () => ({
      pool: data?.pools?.[0],
    }),
    [data?.pools],
  )
}
