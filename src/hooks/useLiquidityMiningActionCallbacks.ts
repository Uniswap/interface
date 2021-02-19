import { TokenAmount } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useStakingRewardsDistributionContract } from './useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { parseUnits } from 'ethers/lib/utils'

/**
 * Returns functions that let a given account stake/withdraw/claim on a specific liquidity mining contract.
 */
export function useLiquidityMiningActionCallbacks(
  distributionContractAddress?: string
): {
  stake: (amount: TokenAmount) => Promise<TransactionResponse>
  withdraw: (amount: TokenAmount) => Promise<TransactionResponse>
  claimAll: (recipient: string) => Promise<TransactionResponse>
} | null {
  const distributionContract = useStakingRewardsDistributionContract(distributionContractAddress, true)

  return useMemo(() => {
    if (!distributionContract) return null
    return {
      stake: async (amount: TokenAmount) =>
        distributionContract.stake(parseUnits(amount.toExact(), amount.token.decimals).toString()),
      withdraw: async (amount: TokenAmount) =>
        distributionContract.withdraw(parseUnits(amount?.toExact(), amount.token.decimals).toString()),
      claimAll: async recipient => distributionContract.claimAll(recipient)
    }
  }, [distributionContract])
}
