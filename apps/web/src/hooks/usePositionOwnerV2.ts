import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
// Since v2 positions are ERC20s, when they are closed, the liquidity token is burned.
// Should do on-chain lookup to check account's balanceOf on the liquidity token to check for ownership
// To check position ownership on V3 positions, should use owner from GetPositions query (positionInfo.owner)instead of on-chain call
import { assume0xAddress } from 'utils/wagmi'
import { Address, erc20Abi } from 'viem'
import { useReadContract } from 'wagmi'

export function usePositionOwnerV2({
  account,
  address,
  chainId,
}: {
  account?: Address
  address?: string
  chainId?: EVMUniverseChainId
}): boolean {
  const resultBalance = useReadContract({
    address: assume0xAddress(address),
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  }).data

  return resultBalance ? resultBalance > 0 : false
}
