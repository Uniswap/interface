import { GraphQLApi } from '@universe/api'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

/** Chain + DB address for TDP chart queries, aligned with the network dropdown (`?chain=` → `selectedMultichainChainId`). */
export function getTDPChartGraphqlTarget({
  multichainTokenUxEnabled,
  selectedMultichainChainId,
  tokenQueryData,
  pathGraphqlChain,
  pathTokenDbAddress,
}: {
  multichainTokenUxEnabled: boolean
  selectedMultichainChainId: UniverseChainId | undefined
  tokenQueryData: TokenQueryData | undefined
  pathGraphqlChain: GraphQLApi.Chain
  pathTokenDbAddress: string | undefined
}): { chain: GraphQLApi.Chain; address: string | undefined } {
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
  if (multichainTokenUxEnabled && selectedMultichainChainId !== undefined && tokenQueryData?.project?.tokens?.length) {
    const gqlChain = getChainInfo(selectedMultichainChainId).backendChain.chain
    const row = tokenQueryData.project.tokens.find((t) => t.chain === gqlChain)
    if (row) {
      const address =
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
        row.address !== undefined && row.address !== null ? row.address : getNativeTokenDBAddress(gqlChain)
      return { chain: gqlChain, address }
    }
  }
  return { chain: pathGraphqlChain, address: pathTokenDbAddress }
}
