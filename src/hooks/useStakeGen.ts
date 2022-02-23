import { BigNumber } from '@ethersproject/bignumber'
import { BASE_TOKEN_DECIMALS } from 'constants/bonds'
import { useStakingContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { TransactionType } from 'state/transactions/actions'
import { useTransactionAdder } from 'state/transactions/hooks'

interface IStakeCallbackArgs {
  amount: number
  account: string | null | undefined
}

export type StakeGenCallbackReturn = { success: boolean; txHash: string | null }

export type StakeGenCallback = (args: IStakeCallbackArgs) => Promise<StakeGenCallbackReturn>

export function useStakeGenCallback(): StakeGenCallback {
  const staking = useStakingContract()
  const addTransaction = useTransactionAdder()

  return useCallback<StakeGenCallback>(
    async ({ amount, account }: IStakeCallbackArgs): Promise<StakeGenCallbackReturn> => {
      if (!staking) return { success: false, txHash: null }

      const REBASING = true
      const CLAIM = true

      const amountBigNumber = BigNumber.from(`${amount * BASE_TOKEN_DECIMALS}`)

      const stakingTx = await staking.stake(account, amountBigNumber, REBASING, CLAIM)

      addTransaction(stakingTx, {
        type: TransactionType.GEN_STAKING,
        amountStaked: amount,
        stakedTo: 'sGEN', // TODO add actual keys here instead of a string
      })

      return { success: true, txHash: null }
    },
    [staking]
  )
}
