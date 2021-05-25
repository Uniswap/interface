import { ethers } from 'ethers'
import { useMasterChefContract } from 'hooks/useContract'
import { useCallback } from 'react'
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
    async (pid: number, amount: string, name: string, shouldHaverst = false) => {
      // KMP decimals depend on asset, SLP is always 18
      // console.log('depositing...', pid, amount)

      try {
        const tx = await masterChefContract?.deposit(pid, ethers.utils.parseUnits(amount, 18), shouldHaverst)
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
    async (pid: number, amount: string, name: string, decimals = 18) => {
      console.log('===withdrawwwwwwwww', pid, ethers.utils.parseUnits(amount, decimals))
      try {
        const tx = await masterChefContract?.withdraw(pid, ethers.utils.parseUnits(amount, decimals))
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

  return { masterChefContract, getPoolLength, getPoolInfo, deposit, withdraw, harvest }
}

export default useMasterChef
