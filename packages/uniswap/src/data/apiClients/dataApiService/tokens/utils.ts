import { type PlainMessage } from '@bufbuild/protobuf'
import { type MultichainToken, type Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { type UniverseChainId } from '@universe/chains'
import {
  getMultichainDeploymentDecimals,
  normalizeBackendNativeAddress,
} from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'

/**
 * Derives the single-chain `Token` view of a `MultichainToken` for one of its deployments. Checks
 * key presence, not truthiness — a native deployment's address is a real but falsy entry, so a
 * truthiness check would misread it as no deployment on this chain.
 */
export function deriveTokenFromMultichainToken({
  multichainToken,
  chainId,
}: {
  multichainToken: PlainMessage<MultichainToken> | undefined
  chainId: UniverseChainId
}): PlainMessage<Token> | undefined {
  const chainKey = String(chainId)
  if (!multichainToken || !(chainKey in multichainToken.addresses)) {
    return undefined
  }
  const address = multichainToken.addresses[chainKey] ?? ''
  return {
    chainId,
    address,
    symbol: multichainToken.symbol,
    decimals: getMultichainDeploymentDecimals({
      chainId,
      address: normalizeBackendNativeAddress({ chainId, address }),
      parentDecimals: multichainToken.decimals,
    }),
    name: multichainToken.name,
    type: multichainToken.type,
    price: multichainToken.price,
    safety: multichainToken.safety,
    fees: multichainToken.fees,
    project: multichainToken.project,
    fdv: multichainToken.fdv,
    categoryIds: multichainToken.categoryIds,
    multichain: { id: multichainToken.multichainId, addresses: multichainToken.addresses },
  }
}
