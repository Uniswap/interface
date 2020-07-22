import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DEFAULT_TOKEN_LIST_URL } from '../../constants'
import { AppDispatch, AppState } from '../index'
import { addList, fetchTokenList } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)

  // we should always fetch the default token list, so add it
  useEffect(() => {
    if (!lists[DEFAULT_TOKEN_LIST_URL]) dispatch(addList(DEFAULT_TOKEN_LIST_URL))
  }, [dispatch, lists])

  // on initial mount, refetch all the lists in storage
  useEffect(() => {
    Object.keys(lists).forEach(listUrl => dispatch(fetchTokenList(listUrl) as any))
    // we only do this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(lists).forEach(listUrl => {
      const list = lists[listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        dispatch(fetchTokenList(listUrl) as any)
      }
    })
  }, [dispatch, lists])

  return null
}
