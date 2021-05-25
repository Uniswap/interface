import { BigNumber } from '@ethersproject/bignumber'
import { KNC } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useCallback, useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useRewardLockerContract } from './useContract'
import { useTransactionAdder } from '../state/transactions/hooks'

const useVesting = () => {
  // SLP is usually 18, KMP is 6
  const addTransaction = useTransactionAdder()
  const [schedules, setSchedules] = useState([])
  const { account, chainId } = useActiveWeb3React()
  const currentBlockNumber = useBlockNumber()
  const lockerContract = useRewardLockerContract()

  const fetchSchedules = useCallback(async () => {
    const getSchedules = async (address: string, token: string | null | undefined): Promise<any> => {
      try {
        const res = await lockerContract?.getVestingSchedules(address, token)
        return res
      } catch (e) {
        return []
      }
    }
    const schedules = !!chainId && !!account ? await getSchedules(account, KNC[chainId].address) : []
    setSchedules(schedules)
  }, [account, chainId, lockerContract])

  useEffect(() => {
    if (account && chainId && lockerContract) {
      fetchSchedules()
    }
  }, [account, setSchedules, currentBlockNumber, fetchSchedules, lockerContract])

  const vestAtIndex = useCallback(
    async (token: string, index: number[]) => {
      try {
        const tx = await lockerContract?.vestScheduleAtIndex(token, index)
        return addTransaction(tx, { summary: `Vest schedule ${index}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [lockerContract, addTransaction]
  )
  return { schedules, vestAtIndex }
}

export default useVesting
