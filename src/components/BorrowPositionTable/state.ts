import { TimePeriod } from 'graphql/data/util'
import { atom, useAtom } from 'jotai'
import { atomWithReset } from 'jotai/utils'
import { useCallback } from 'react'

export enum PositionSortMethod {
  BORROWED_AMOUNT = 'Borrowed',
  COLLATERAL = 'Collateral',
  REPAYTIME = 'Time Left',
  REMAINING = "Prem. Left",
  ACTIONS = 'Actions',
  LTV="LTV"
  // UNUSED_PREMIUM = 'Unused Premium'
}

export const filterStringAtom = atomWithReset<string>('')
export const filterTimeAtom = atom<TimePeriod>(TimePeriod.DAY)
export const sortMethodAtom = atom<PositionSortMethod>(PositionSortMethod.BORROWED_AMOUNT)
export const sortAscendingAtom = atom<boolean>(false)

/* keep track of sort category for token table */
export function useSetSortMethod(newSortMethod: PositionSortMethod) {
  const [sortMethod, setSortMethod] = useAtom(sortMethodAtom)
  const [sortAscending, setSortAscending] = useAtom(sortAscendingAtom)

  return useCallback(() => {
    if (sortMethod === newSortMethod) {
      setSortAscending(!sortAscending)
    } else {
      setSortMethod(newSortMethod)
      setSortAscending(false)
    }
  }, [sortMethod, setSortMethod, setSortAscending, sortAscending, newSortMethod])
}
