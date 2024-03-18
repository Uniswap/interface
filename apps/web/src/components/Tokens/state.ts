import { TimePeriod } from 'graphql/data/util'
import { atom, useAtom } from 'jotai'
import { atomWithReset, useUpdateAtom } from 'jotai/utils'
import { useCallback } from 'react'

export enum TokenSortMethod {
  FULLY_DILUTED_VALUATION = 'FDV',
  PRICE = 'Price',
  VOLUME = 'Volume',
  HOUR_CHANGE = '1 hour',
  DAY_CHANGE = '1 day',
}

export const exploreSearchStringAtom = atomWithReset<string>('')
export const filterTimeAtom = atom<TimePeriod>(TimePeriod.DAY)
export const sortMethodAtom = atom<TokenSortMethod>(TokenSortMethod.VOLUME)
export const sortAscendingAtom = atom<boolean>(false)

/* keep track of sort category for token table */
export function useSetSortMethod(newSortMethod: TokenSortMethod) {
  const [sortMethod, setSortMethod] = useAtom(sortMethodAtom)
  const setSortAscending = useUpdateAtom(sortAscendingAtom)

  return useCallback(() => {
    if (sortMethod === newSortMethod) {
      setSortAscending((sortAscending) => !sortAscending)
    } else {
      setSortMethod(newSortMethod)
      setSortAscending(false)
    }
  }, [sortMethod, setSortMethod, setSortAscending, newSortMethod])
}
