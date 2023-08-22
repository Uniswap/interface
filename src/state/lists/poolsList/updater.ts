import { getVersionUpgrade, VersionUpgrade } from '@uniswap/token-lists'
import { useWeb3React } from '@web3-react/core'
import { POOLS_LIST } from 'constants/lists'
import useInterval from 'lib/hooks/useInterval'
import ms from 'ms'
import { useCallback, useEffect } from 'react'
import { useAppDispatch } from 'state/hooks'
import { usePoolsList } from 'state/lists/poolsList/hooks'

import { useFetchPoolListCallback } from '../../../hooks/useFetchPoolListCallback'
import useIsWindowVisible from '../../../hooks/useIsWindowVisible'
import { acceptListUpdate } from './actions'
import { shouldAcceptVersionUpdate } from './utils'

export default function Updater(): null {
  const { provider } = useWeb3React()
  const dispatch = useAppDispatch()
  const isWindowVisible = useIsWindowVisible()

  // get all loaded lists, and the active urls
  const lists = usePoolsList()

  const fetchList = useFetchPoolListCallback()
  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) return
    POOLS_LIST.forEach((url) => {
      // Skip validation on unsupported lists
      const isUnsupportedList = false
      fetchList(url, isUnsupportedList).catch((error) => console.debug('interval list fetching error', error))
    })
  }, [fetchList, isWindowVisible])

  // fetch all lists every 10 minutes, but only after we initialize provider
  useInterval(fetchAllListsCallback, provider ? ms(`10m`) : null)

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(lists).forEach((listUrl) => {
      const list = lists[listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl).catch((error) => console.debug('list added fetching error', error))
      }
    })
  }, [dispatch, fetchList, lists])

  // automatically update lists if versions are minor/patch
  useEffect(() => {
    Object.keys(lists).forEach((listUrl) => {
      const list = lists[listUrl]
      if (list.current && list.pendingUpdate) {
        const bump = getVersionUpgrade(list.current.version, list.pendingUpdate.version)
        switch (bump) {
          case VersionUpgrade.NONE:
            throw new Error('unexpected no version bump')
          case VersionUpgrade.PATCH:
          case VersionUpgrade.MINOR: {
            if (shouldAcceptVersionUpdate(listUrl, list.current, list.pendingUpdate, bump)) {
              dispatch(acceptListUpdate(listUrl))
            }
            break
          }
          // update any active or inactive lists
          case VersionUpgrade.MAJOR:
            dispatch(acceptListUpdate(listUrl))
        }
      }
    })
  }, [dispatch, lists])

  return null
}
