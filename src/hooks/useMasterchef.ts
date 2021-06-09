import { useCallback } from 'react'
import { BigNumber } from 'ethers'

import { useMasterChefContract } from 'hooks/useContract'
import { useTransactionAdder } from '../state/transactions/hooks'

const useMasterChef = () => {
  const addTransaction = useTransactionAdder()
  const masterChefContract = useMasterChefContract() // withSigner

  const getPoolLength = useCallback(async () => {
    try {
      const poolLength = await masterChefContract?.poolLength()

      return poolLength
    } catch (err) {
      console.error(err)
      return err
    }
  }, [masterChefContract])

  const getPoolInfo = useCallback(
    async (pid: number) => {
      try {
        const poolInfo = await masterChefContract?.poolInfo(pid)

        return poolInfo
      } catch (err) {
        console.error(err)
        return err
      }
    },
    [masterChefContract]
  )

  // Deposit
  const deposit = useCallback(
    async (pid: number, amount: BigNumber, name: string, shouldHaverst = false) => {
      try {
        const tx = await masterChefContract?.deposit(pid, amount, shouldHaverst)
        return addTransaction(tx, { summary: `Deposit ${name}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [addTransaction, masterChefContract]
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber, name: string) => {
      try {
        const tx = await masterChefContract?.withdraw(pid, amount)
        return addTransaction(tx, { summary: `Withdraw ${name}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [addTransaction, masterChefContract]
  )

  const harvest = useCallback(
    async (pid: number, name: string) => {
      try {
        const tx = await masterChefContract?.harvest(pid)
        return addTransaction(tx, { summary: `Harvest ${name}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [addTransaction, masterChefContract]
  )

  const harvestMultiplePools = useCallback(
    async (pids: number[]) => {
      try {
        const tx = await masterChefContract?.harvestMultiplePools(pids)
        return addTransaction(tx, { summary: `Harvest multiple pools: ${pids.join(',')}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [addTransaction, masterChefContract]
  )

  return { masterChefContract, getPoolLength, getPoolInfo, deposit, withdraw, harvest, harvestMultiplePools }
}

export default useMasterChef
