import type { PlainMessage } from '@bufbuild/protobuf'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

/** Chain + DB address for TDP chart queries, aligned with the network dropdown (`?chain=` → `selectedMultichainChainId`). */
export function getTDPChartTarget({
  selectedMultichainChainId,
  multichainToken,
  pathChainId,
  pathTokenDbAddress,
}: {
  selectedMultichainChainId: UniverseChainId | undefined
  multichainToken: PlainMessage<MultichainToken> | undefined
  pathChainId: UniverseChainId
  pathTokenDbAddress: string | undefined
}): { chainId: UniverseChainId; address: string | undefined } {
  if (selectedMultichainChainId !== undefined) {
    const deploymentAddress = multichainToken?.addresses[String(selectedMultichainChainId)]
    if (deploymentAddress) {
      // native deployments carry a real indexed address in the V2 shape; charts query by the DB native address
      const address = isNativeCurrencyAddress(selectedMultichainChainId, deploymentAddress)
        ? getNativeTokenDBAddress(selectedMultichainChainId)
        : deploymentAddress
      return { chainId: selectedMultichainChainId, address }
    }
  }
  return { chainId: pathChainId, address: pathTokenDbAddress }
}
