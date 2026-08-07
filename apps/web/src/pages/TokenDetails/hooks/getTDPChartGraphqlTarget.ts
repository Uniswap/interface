import type { PlainMessage } from '@bufbuild/protobuf'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { GraphQLApi } from '@universe/api'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

/** Chain + DB address for TDP chart queries, aligned with the network dropdown (`?chain=` → `selectedMultichainChainId`). */
export function getTDPChartGraphqlTarget({
  selectedMultichainChainId,
  multichainToken,
  pathGraphqlChain,
  pathTokenDbAddress,
}: {
  selectedMultichainChainId: UniverseChainId | undefined
  multichainToken: PlainMessage<MultichainToken> | undefined
  pathGraphqlChain: GraphQLApi.Chain
  pathTokenDbAddress: string | undefined
}): { chain: GraphQLApi.Chain; address: string | undefined } {
  if (selectedMultichainChainId !== undefined) {
    const deploymentAddress = multichainToken?.addresses[String(selectedMultichainChainId)]
    if (deploymentAddress) {
      const gqlChain = getChainInfo(selectedMultichainChainId).backendChain.chain
      // native deployments carry a real indexed address in the V2 shape; charts query by the DB native address
      const address = isNativeCurrencyAddress(selectedMultichainChainId, deploymentAddress)
        ? getNativeTokenDBAddress(gqlChain)
        : deploymentAddress
      return { chain: gqlChain, address }
    }
  }
  return { chain: pathGraphqlChain, address: pathTokenDbAddress }
}
