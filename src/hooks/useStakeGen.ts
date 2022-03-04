import { parseUnits } from '@ethersproject/units'
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

interface IUnstakeCallbackArgs {
  amount: number
  account: string | null | undefined
  unstakingTokenName: string | undefined
  rebasing: boolean
}

export type StakeGenCallbackReturn = { success: boolean; txHash: string | null }
export type UnstakeGenCallbackReturn = { success: boolean; txHash: string | null }
export type StakeGenCallback = () => Promise<StakeGenCallbackReturn>
export type UnstakeGenCallback = () => Promise<StakeGenCallbackReturn>

// TODO: change return type to void
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

    const stakingTx = await staking.stake(account, parseUnits(`${amount}`, 'gwei'), rebasing, true)

    addTransaction(stakingTx, {
      type: TransactionType.GEN_STAKING,
      amountStaked: amount,
      stakedTo: stakingTokenName,
      op: 'staked',
    })

    return { success: true, txHash: null }
  }, [staking, account, addTransaction, amount, rebasing, stakingTokenName])
}

// TODO: change return type to void
export function useUnstakeGenCallback({ amount, account, unstakingTokenName, rebasing }: IUnstakeCallbackArgs) {
  const staking = useStakingContract()
  const addTransaction = useTransactionAdder()

  return useCallback<UnstakeGenCallback>(async (): Promise<UnstakeGenCallbackReturn> => {
    if (!staking) return { success: false, txHash: null }

    const unstakingTx = await staking.unstake(
      account,
      parseUnits(`${amount}`, rebasing ? 'gwei' : 'ether'),
      true,
      rebasing
    )

    addTransaction(unstakingTx, {
      type: TransactionType.GEN_STAKING,
      amountStaked: amount,
      stakedTo: unstakingTokenName,
      op: 'unstaked',
    })

    return { success: true, txHash: null }
  }, [account, addTransaction, amount, rebasing, staking, unstakingTokenName])
}
