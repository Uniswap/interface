// eslint-disable-next-line no-restricted-imports
import { useTokenContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Address } from 'viem'

// Since v2 positions are ERC20s, when they are closed, the liquidity token is burned.
// Should do on-chain lookup to check account's balanceOf on the liquidity token to check for ownership
// To check position ownership on V3 positions, should use owner from GetPositions query (positionInfo.owner)instead of on-chain call
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
