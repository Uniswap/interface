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
      return err
    }
  }, [fairLaunchContract])

  // Deposit
  const deposit = useCallback(
    async (pid: number, amount: BigNumber, name: string, shouldHaverst = false) => {
      try {
        const tx = await fairLaunchContract?.deposit(pid, amount, shouldHaverst)
        return addTransaction(tx, { summary: `Deposit ${name}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [addTransaction, fairLaunchContract]
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber, name: string) => {
      try {
        const tx = await fairLaunchContract?.withdraw(pid, amount)
        return addTransaction(tx, { summary: `Withdraw ${name}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [addTransaction, fairLaunchContract]
  )

  const harvest = useCallback(
    async (pid: number, name: string) => {
      try {
        const tx = await fairLaunchContract?.harvest(pid)
        return addTransaction(tx, { summary: `Harvest ${name}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [addTransaction, fairLaunchContract]
  )

  const harvestMultiplePools = useCallback(
    async (pids: number[]) => {
      try {
        const tx = await fairLaunchContract?.harvestMultiplePools(pids)
        return addTransaction(tx, { summary: `Harvest multiple pools: ${pids.join(',')}` })
      } catch (e) {
        console.error(e)
        return e
      }
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
