import { useCallback } from 'react'

import { useRewardLockerContract } from './useContract'
import { useTransactionAdder } from '../state/transactions/hooks'

const useVesting = (rewardLockerAddress: string) => {
  const addTransaction = useTransactionAdder()
  const lockerContract = useRewardLockerContract(rewardLockerAddress)

  const vestAtIndex = useCallback(
    async (token: string, index: number[]) => {
      const tx = await lockerContract?.vestScheduleAtIndices(token, index)
      addTransaction(tx, { summary: `Claim schedule ${index}` })

      return tx.hash
    },
    [lockerContract, addTransaction]
  )

  const vestMultipleTokensAtIndices = useCallback(
    async (tokens: string[], indices: number[][]) => {
      const tx = await lockerContract?.vestScheduleForMultipleTokensAtIndices(tokens, indices)
      addTransaction(tx, { summary: `Claim all` })

      return tx.hash
    },
    [lockerContract, addTransaction]
  )

  return { vestAtIndex, vestMultipleTokensAtIndices }
}

export default useVesting
