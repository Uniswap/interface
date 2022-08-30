import { BigNumber } from '@ethersproject/bignumber'
import { Zero } from '@ethersproject/constants'
import { Chef } from 'constants/farm/chef.enum'
import { useActiveWeb3React } from 'hooks'
import { useSushiContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { useChefContract } from './useChefContract'

// import { Chef } from './enum'
// import { useChefContract } from './hooks'

export default function useMasterChef(chef: Chef) {
  const { account } = useActiveWeb3React()

  const sushi = useSushiContract()

  const contract = useChefContract(chef)

  // Deposit
  const deposit = useCallback(
    async (pid: number, amount: BigNumber) => {
      try {
        let tx

        if (chef === Chef.MASTERCHEF) {
          tx = await contract?.deposit(pid, amount)
        } else {
          tx = await contract?.deposit(pid, amount, account)
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, chef, contract]
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber) => {
      try {
        let tx

        if (chef === Chef.MASTERCHEF) {
          tx = await contract?.withdraw(pid, amount)
        } else if (chef === Chef.MINICHEF) {
          tx = await contract?.withdrawAndHarvest(pid, amount, account)
        } else {
          tx = await contract?.withdraw(pid, amount, account)
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, chef, contract]
  )

  const harvest = useCallback(
    async (pid: number) => {
      try {
        let tx

        if (chef === Chef.MASTERCHEF) {
          tx = await contract?.deposit(pid, Zero)
        } else if (chef === Chef.MASTERCHEF_V2) {
          const pendingSushi = await contract?.pendingSushi(pid, account)

          const balanceOf = await sushi?.balanceOf(contract?.address)

          // If MasterChefV2 doesn't have enough sushi to harvest, batch in a harvest.
          if (pendingSushi.gt(balanceOf)) {
            tx = await contract?.batch(
              [
                contract?.interface?.encodeFunctionData('harvestFromMasterChef'),
                contract?.interface?.encodeFunctionData('harvest', [pid, account]),
              ],
              true
            )
          } else {
            tx = await contract?.harvest(pid, account)
          }
        } else if (chef === Chef.MINICHEF) {
          tx = await contract?.harvest(pid, account)
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, chef, contract, sushi]
  )

  return { deposit, withdraw, harvest }
}