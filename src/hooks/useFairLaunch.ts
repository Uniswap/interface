import { useCallback } from 'react'
import { BigNumber } from 'ethers'

import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useFairLaunchContract } from 'hooks/useContract'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin } from 'utils'
import { getFullDisplayBalance } from 'utils/formatBalance'

const useFairLaunch = (address: string) => {
  const addTransaction = useTransactionAdder()
  const fairLaunchContract = useFairLaunchContract(address) // withSigner

  const getPoolLength = useCallback(async () => {
    try {
      const poolLength = await fairLaunchContract?.poolLength()

      return poolLength
    } catch (err) {
      console.error(err)
      return err
    }
  }, [fairLaunchContract])

  const getPoolInfo = useCallback(
    async (pid: number) => {
      try {
        const poolInfo = await fairLaunchContract?.getPoolInfo(pid)

        return poolInfo
      } catch (err) {
        console.error(err)
        return err
      }
    },
    [fairLaunchContract]
  )

  const getRewardTokens = useCallback(async (): Promise<string[]> => {
    try {
      const rewardTokens = await fairLaunchContract?.getRewardTokens()

      return rewardTokens
    } catch (err) {
      console.error(err)
      return []
    }
  }, [fairLaunchContract])

  // Deposit
  const deposit = useCallback(
    async (pid: number, amount: BigNumber, name: string, shouldHaverst = false) => {
      if (!fairLaunchContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await fairLaunchContract.estimateGas.deposit(pid, amount, shouldHaverst)
      const tx = await fairLaunchContract.deposit(pid, amount, shouldHaverst, {
        gasLimit: calculateGasMargin(estimateGas)
      })
      addTransaction(tx, { type: 'Stake', summary: `${getFullDisplayBalance(amount)} ${name} Tokens` })

      return tx.hash
    },
    [addTransaction, fairLaunchContract]
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber, name: string) => {
      if (!fairLaunchContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await fairLaunchContract.estimateGas.withdraw(pid, amount)
      const tx = await fairLaunchContract.withdraw(pid, amount, {
        gasLimit: calculateGasMargin(estimateGas)
      })
      addTransaction(tx, { type: 'Unstake', summary: `${getFullDisplayBalance(amount)} ${name} Tokens` })

      return tx.hash
    },
    [addTransaction, fairLaunchContract]
  )

  const harvest = useCallback(
    async (pid: number, name: string) => {
      if (!fairLaunchContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await fairLaunchContract.estimateGas.harvest(pid)
      const tx = await fairLaunchContract.harvest(pid, {
        gasLimit: calculateGasMargin(estimateGas)
      })
      addTransaction(tx, { type: 'Harvest' })

      return tx.hash
    },
    [addTransaction, fairLaunchContract]
  )

  const harvestMultiplePools = useCallback(
    async (pids: number[]) => {
      if (!fairLaunchContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await fairLaunchContract.estimateGas.harvestMultiplePools(pids)
      const tx = await fairLaunchContract.harvestMultiplePools(pids, {
        gasLimit: calculateGasMargin(estimateGas)
      })
      addTransaction(tx, { summary: `Harvest multiple pools: ${pids.join(',')}` })

      return tx.hash
    },
    [addTransaction, fairLaunchContract]
  )

  return {
    masterChefContract: fairLaunchContract,
    getPoolLength,
    getPoolInfo,
    getRewardTokens,
    deposit,
    withdraw,
    harvest,
    harvestMultiplePools
  }
}

export default useFairLaunch
