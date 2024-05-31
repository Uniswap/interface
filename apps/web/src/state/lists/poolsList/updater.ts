import { getVersionUpgrade, VersionUpgrade } from '@uniswap/token-lists'
import { useWeb3React } from '@web3-react/core'
import { POOLS_LIST } from 'constants/lists'
import { useStateRehydrated } from 'hooks/useStateRehydrated'
import useInterval from 'lib/hooks/useInterval'
import ms from 'ms'
import { useCallback, useEffect } from 'react'
import { useAppDispatch } from 'state/hooks'
import { usePoolsList } from 'state/lists/poolsList/hooks'

import { useFetchPoolListCallback } from '../../../hooks/useFetchPoolListCallback'
import useIsWindowVisible from '../../../hooks/useIsWindowVisible'
import { acceptListUpdate } from './actions'

export default function Updater(): null {
  const { provider } = useWeb3React()
  const dispatch = useAppDispatch()
  const isWindowVisible = useIsWindowVisible()

  // get all loaded lists, and the active urls
  const lists = usePoolsList()
  const rehydrated = useStateRehydrated()

  const fetchList = useFetchPoolListCallback()
  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) {
      return
    }
    POOLS_LIST.forEach((url) => {
      // Skip validation on unsupported lists
      const isUnsupportedList = false
      fetchList(url, isUnsupportedList).catch((error) => console.debug('interval list fetching error', error))
    })
  }, [fetchList, isWindowVisible])

  // fetch all lists every 10 minutes, but only after we initialize provider
  useInterval(fetchAllListsCallback, provider ? ms(`10m`) : null)

  useEffect(() => {
    if (!rehydrated || !lists) {
      return
    } // loaded lists will not be available until state is rehydrated

    // whenever a list is not loaded and not loading, try again to load it
    Object.keys(lists).forEach((listUrl) => {
      const list = lists[listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl).catch((error) => console.debug('list added fetching error', error))
      }
    })
    POOLS_LIST.forEach((listUrl) => {
      const list = lists[listUrl]
      if (!list || (!list.current && !list.loadingRequestId && !list.error)) {
        fetchList(listUrl, /* isUnsupportedList= */ true).catch((error) =>
          console.debug('list added fetching error', error)
        )
      }
    })
  }, [dispatch, fetchList, lists, rehydrated])

  // automatically update lists if versions are minor/patch
  useEffect(() => {
    if (!rehydrated || !lists) {
      return
    } // loaded lists will not be available until state is rehydrated

    Object.keys(lists).forEach((listUrl) => {
      const list = lists[listUrl]
      if (list.current && list.pendingUpdate) {
        const bump = getVersionUpgrade(list.current.version, list.pendingUpdate.version)
        switch (bump) {
          case VersionUpgrade.NONE:
            throw new Error('unexpected no version bump')
          case VersionUpgrade.PATCH:
          case VersionUpgrade.MINOR:
          case VersionUpgrade.MAJOR:
            dispatch(acceptListUpdate(listUrl))
        }
      }
    })
  }, [dispatch, lists, rehydrated])

  return null
}
