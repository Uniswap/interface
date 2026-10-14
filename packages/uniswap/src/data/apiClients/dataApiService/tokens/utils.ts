import { type PlainMessage } from '@bufbuild/protobuf'
import { type Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { type UniverseChainId } from '@universe/chains'
import {
  type DataApiMultichainToken,
  getMultichainDeployment,
} from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'

/** Derives the single-chain `Token` view of a `MultichainToken` for one of its deployments. */
export function deriveTokenFromMultichainToken({
  multichainToken,
  chainId,
}: {
  multichainToken: DataApiMultichainToken | undefined
  chainId: UniverseChainId
}): PlainMessage<Token> | undefined {
  const deployment = multichainToken && getMultichainDeployment({ multichainToken, chainId })
  if (!multichainToken || !deployment) {
    return undefined
  }
  return {
    chainId,
    // As served, matching GetToken; `deployment.address` is normalized for the app.
    address: deployment.rawAddress,
    symbol: multichainToken.symbol,
    decimals: deployment.decimals,
    name: multichainToken.name,
    type: multichainToken.type,
    price: multichainToken.price,
    safety: multichainToken.safety,
    fees: multichainToken.fees,
    project: multichainToken.project,
    fdv: multichainToken.fdv,
    categoryIds: multichainToken.categoryIds,
    issuer: multichainToken.issuer,
    multichain: { id: multichainToken.multichainId, addresses: multichainToken.addresses },
  }
}
