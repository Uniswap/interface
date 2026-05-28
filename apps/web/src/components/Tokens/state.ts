/* eslint-disable import/no-unused-modules */
import { RingTimePeriod, TimePeriod } from 'appGraphql/data/util'
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

export enum RingTokenSortMethod {
  TOTAL_VALUE_LOCKED = 'TVL',
  PRICE = 'Price',
  VOLUME = 'Volume',
  HOUR_CHANGE = '1 hour',
  DAY_CHANGE = '1 day',
}

export const exploreSearchStringAtom = atomWithReset<string>('')
export const filterTimeAtom = atom<TimePeriod>(TimePeriod.DAY)
export const filterRingTimeAtom = atom<RingTimePeriod>(RingTimePeriod.DAY)

export const sortMethodAtom = atom<TokenSortMethod>(TokenSortMethod.VOLUME)
export const sortRingMethodAtom = atom<RingTokenSortMethod>(RingTokenSortMethod.VOLUME)
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

/* keep track of sort category for token table */
export function useSetSortRingMethod(newSortMethod: RingTokenSortMethod) {
  const [sortMethod, setSortMethod] = useAtom(sortRingMethodAtom)
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
