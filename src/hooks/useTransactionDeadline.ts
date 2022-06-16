import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../state'

// combines the block timestamp with the user setting to give the deadline that should be used for any submitted transaction
export default function useTransactionDeadline(): BigNumber | undefined {
  const ttl = useSelector<AppState, number>(state => state.user.userDeadline)

  const currentTimeStamp = BigNumber.from(Math.floor(+new Date() / 1000))
  return useMemo(() => {
    if (currentTimeStamp && ttl) return currentTimeStamp.add(ttl)
    return undefined
  }, [currentTimeStamp, ttl])
}
