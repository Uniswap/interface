import { useCallback } from 'react'
import { BigNumber } from 'ethers'

import { useFairLaunchContract } from 'hooks/useContract'
import { useTransactionAdder } from '../state/transactions/hooks'

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
      const tx = await fairLaunchContract?.deposit(pid, amount, shouldHaverst)
      addTransaction(tx, { summary: `Deposit ${name}` })

      return tx.hash
    },
    [addTransaction, fairLaunchContract]
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber, name: string) => {
      const tx = await fairLaunchContract?.withdraw(pid, amount)
      addTransaction(tx, { summary: `Withdraw ${name}` })

      return tx.hash
    },
    [addTransaction, fairLaunchContract]
  )

  const harvest = useCallback(
    async (pid: number, name: string) => {
      const tx = await fairLaunchContract?.harvest(pid)
      addTransaction(tx, { summary: `Harvest ${name}` })

      return tx.hash
    },
    [addTransaction, fairLaunchContract]
  )

  const harvestMultiplePools = useCallback(
    async (pids: number[]) => {
      const tx = await fairLaunchContract?.harvestMultiplePools(pids)
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
