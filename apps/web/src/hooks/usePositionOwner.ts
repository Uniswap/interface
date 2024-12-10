import { BigNumber } from '@ethersproject/bignumber'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useTokenContract } from 'hooks/useContract'
import { TokenId, useNFTPositionManagerContract } from 'hooks/usePositionTokenURI'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Address } from 'viem'

export function usePositionOwner(
  tokenId: TokenId | undefined,
  chainId?: UniverseChainId,
  version?: ProtocolVersion,
): string | undefined {
  const contract = useNFTPositionManagerContract(version ?? ProtocolVersion.V3, chainId)
  const input = tokenId instanceof BigNumber ? tokenId.toHexString() : tokenId?.toString(16)
  return useSingleCallResult(tokenId ? contract : null, 'ownerOf', [input]).result?.[0]
}

export function usePositionOwnerV2(
  account: Address | undefined,
  address: string | null,
  chainId?: UniverseChainId,
): boolean {
  const contract = useTokenContract(address ?? undefined, false, chainId)
  const resultBalance = useSingleCallResult(contract, 'balanceOf', [account ?? undefined]).result?.[0].toString()
  const isOwner = resultBalance ? JSBI.GT(JSBI.BigInt(resultBalance), JSBI.BigInt(0)) : false

  return isOwner
}
