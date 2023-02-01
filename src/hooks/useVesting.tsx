import { useCallback } from 'react'

import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useRewardLockerContract } from 'hooks/useContract'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'

const useVesting = (rewardLockerAddress: string) => {
  const addTransactionWithType = useTransactionAdder()
  const lockerContract = useRewardLockerContract(rewardLockerAddress)

  const vestAtIndex = useCallback(
    async (token: string, index: number[]) => {
      if (!lockerContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await lockerContract.estimateGas.vestScheduleAtIndices(token, index)
      const tx = await lockerContract.vestScheduleAtIndices(token, index, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.CLAIM_REWARD,
        extraInfo: { summary: 'reward' },
      })

      return tx.hash
    },
    [lockerContract, addTransactionWithType],
  )

  const vestMultipleTokensAtIndices = useCallback(
    async (tokens: string[], indices: number[][]) => {
      if (!lockerContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await lockerContract.estimateGas.vestScheduleForMultipleTokensAtIndices(tokens, indices)
      const tx = await lockerContract.vestScheduleForMultipleTokensAtIndices(tokens, indices, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.CLAIM_REWARD,
        extraInfo: { summary: 'all rewards' },
      })

      return tx.hash
    },
    [lockerContract, addTransactionWithType],
  )

  return { vestAtIndex, vestMultipleTokensAtIndices }
}

export default useVesting
