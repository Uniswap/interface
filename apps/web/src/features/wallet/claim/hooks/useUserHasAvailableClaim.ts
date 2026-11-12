import { MERKLE_DISTRIBUTOR_ADDRESS } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useReadContract } from 'wagmi'
import { assume0xAddress } from '~/chains'
import { merkleDistributorAbi } from '~/features/wallet/claim/constants'
import { useUserClaimData } from '~/features/wallet/claim/hooks/useUserClaimData'

// check if user is in blob and has not yet claimed UNI
export function useUserHasAvailableClaim(account: string | null | undefined): boolean {
  const userClaimData = useUserClaimData(account)

  const { data: isClaimed, isLoading: isClaimedLoading } = useReadContract({
    address: assume0xAddress(MERKLE_DISTRIBUTOR_ADDRESS[UniverseChainId.Mainnet]),
    chainId: UniverseChainId.Mainnet,
    abi: merkleDistributorAbi,
    functionName: 'isClaimed',
    args: userClaimData ? [BigInt(userClaimData.index)] : undefined,
    query: { enabled: !!userClaimData },
  })

  // user is in blob and contract marks as unclaimed
  return Boolean(userClaimData && !isClaimedLoading && !isClaimed)
}
