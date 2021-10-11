import { useCallback } from 'react'

import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useRewardLockerContract } from 'hooks/useContract'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin } from 'utils'

const useVesting = (rewardLockerAddress: string) => {
  const addTransaction = useTransactionAdder()
  const lockerContract = useRewardLockerContract(rewardLockerAddress)

  const vestAtIndex = useCallback(
    async (token: string, index: number[]) => {
      if (!lockerContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await lockerContract.estimateGas.vestScheduleAtIndices(token, index)
      const tx = await lockerContract.vestScheduleAtIndices(token, index, {
        gasLimit: calculateGasMargin(estimateGas)
      })
      addTransaction(tx, { summary: `Claim schedule ${index}` })

      return tx.hash
    },
    [lockerContract, addTransaction]
  )

  const vestMultipleTokensAtIndices = useCallback(
    async (tokens: string[], indices: number[][]) => {
      if (!lockerContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await lockerContract.estimateGas.vestScheduleForMultipleTokensAtIndices(tokens, indices)
      const tx = await lockerContract.vestScheduleForMultipleTokensAtIndices(tokens, indices, {
        gasLimit: calculateGasMargin(estimateGas)
      })
      addTransaction(tx, { summary: `Claim all` })

      return tx.hash
    },
    [lockerContract, addTransaction]
  )

  return { vestAtIndex, vestMultipleTokensAtIndices }
}

export default useVesting
