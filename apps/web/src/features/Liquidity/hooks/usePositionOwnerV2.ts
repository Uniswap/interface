import { EVMUniverseChainId } from '@universe/chains'
import { useReadContract } from 'wagmi'
import { type Address, assume0xAddress, erc20Abi } from '~/chains'

/**
 * Whether `account` holds any of the pair's liquidity tokens. V2 positions are ERC-20 balances (the
 * token is burned on close), so ownership is an onchain `balanceOf` rather than the `owner` the
 * position read returns for V3. Resolves to `undefined` until that read settles, or if it fails, so
 * callers can tell "not the owner" from "not known yet".
 */
export function usePositionOwnerV2({
  account,
  address,
  chainId,
}: {
  account?: Address
  address?: string
  chainId?: EVMUniverseChainId
}): boolean | undefined {
  const { data: balance } = useReadContract({
    address: assume0xAddress(address),
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  })

  return balance === undefined ? undefined : balance > 0n
}
