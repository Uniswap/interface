import { TimePeriodLeaderboard } from 'graphql/utils/util'
import { atom, useAtom } from 'jotai'
import { atomWithReset } from 'jotai/utils'
import { useCallback } from 'react'

export enum LeaderboardSortMethod {
  TRADES = 'Trades',
  VOLUME_USDT = 'VolumeUSDT',
}

export const rankAtom = atomWithReset<string>('')
export const filterStringAtom = atomWithReset<string>('')
export const filterTimeAtom = atom<TimePeriodLeaderboard>(TimePeriodLeaderboard.DAY)
export const sortMethodAtom = atom<LeaderboardSortMethod>(LeaderboardSortMethod.TRADES)
export const sortAscendingAtom = atom<boolean>(false)

/* keep track of sort category for token table */
export function useSetSortMethod(newSortMethod: LeaderboardSortMethod) {
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
