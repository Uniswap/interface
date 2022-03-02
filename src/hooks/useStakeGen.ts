import { BigNumber } from '@ethersproject/bignumber'
import { BASE_TOKEN_DECIMALS } from 'constants/bonds'
import { useStakingContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { TransactionType } from 'state/transactions/actions'
import { useTransactionAdder } from 'state/transactions/hooks'

interface IStakeCallbackArgs {
  amount: number
  account: string | null | undefined
  stakingTokenName: string | undefined
  rebasing: boolean
}

export type StakeGenCallbackReturn = { success: boolean; txHash: string | null }

export type StakeGenCallback = () => Promise<StakeGenCallbackReturn>

export function useStakeGenCallback({
  amount,
  account,
  stakingTokenName,
  rebasing,
}: IStakeCallbackArgs): StakeGenCallback {
  const staking = useStakingContract()
  const addTransaction = useTransactionAdder()

  return useCallback<StakeGenCallback>(async (): Promise<StakeGenCallbackReturn> => {
    if (!staking) return { success: false, txHash: null }

    const CLAIM = true

    const amountBigNumber = BigNumber.from(`${amount * BASE_TOKEN_DECIMALS}`)

    const stakingTx = await staking.stake(account, amountBigNumber, rebasing, CLAIM)

    addTransaction(stakingTx, {
      type: TransactionType.GEN_STAKING,
      amountStaked: amount,
      stakedTo: stakingTokenName, // TODO add actual keys here instead of a string
    })

    return { success: true, txHash: null }
  }, [staking, account, addTransaction, amount, rebasing, stakingTokenName])
}
