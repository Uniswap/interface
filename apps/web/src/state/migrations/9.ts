import { DEFAULT_INACTIVE_LIST_URLS } from 'constants/lists'
import { PersistState } from 'redux-persist'
import { ListsState } from 'state/lists/types'

export type PersistAppStateV9 = {
  _persist: PersistState
} & { lists?: ListsState }

/**
 * Migration to delete unused lists from the state.
 */
export const migration9 = (state: PersistAppStateV9 | undefined) => {
  if (!state) {
    return state
  }

  let updatedListsByUrl = state.lists?.byUrl
  if (state.lists?.byUrl) {
    updatedListsByUrl = Object.fromEntries(
      Object.entries(state.lists.byUrl).filter(([url]) => {
        return DEFAULT_INACTIVE_LIST_URLS.includes(url)
      }),
    )
  }

  return {
    ...state,
    lists: {
      byUrl: updatedListsByUrl,
    },
    _persist: {
      ...state._persist,
      version: 9,
    },
  }
}
