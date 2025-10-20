import { getVersionUpgrade, VersionUpgrade } from '@uniswap/token-lists'
import { useWeb3React } from '@web3-react/core'
import { DEFAULT_INACTIVE_LIST_URLS } from 'constants/lists'
import { useFetchListCallback } from 'hooks/useFetchListCallback'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useStateRehydrated } from 'hooks/useStateRehydrated'
import useInterval from 'lib/hooks/useInterval'
import ms from 'ms'
import { useCallback, useEffect } from 'react'
import { useAppDispatch } from 'state/hooks'
import { acceptListUpdate } from 'state/lists/actions'
import { useAllLists } from 'state/lists/hooks'
import { logger } from 'utilities/src/logger/logger'

// TODO(WEB-3839): delete this when lists are removed from redux
export default function Updater(): null {
  const { provider } = useWeb3React()
  const dispatch = useAppDispatch()
  const isWindowVisible = useIsWindowVisible()

  // get all loaded lists, and the active urls
  const lists = useAllLists()
  const rehydrated = useStateRehydrated()

  const fetchList = useFetchListCallback()
  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) {
      return
    }
    DEFAULT_INACTIVE_LIST_URLS.forEach((url) => {
      fetchList(url, false).catch((error) =>
        logger.debug('lists/updater', 'Updater', 'interval list fetching error', error),
      )
    })
  }, [fetchList, isWindowVisible])

  // fetch all lists every 10 minutes, but only after we initialize provider
  useInterval(fetchAllListsCallback, provider ? ms(`10m`) : null)

  useEffect(() => {
    if (!rehydrated) {
      return
    } // loaded lists will not be available until state is rehydrated

    // whenever a list is not loaded and not loading, try again to load it
    Object.keys(lists).forEach((listUrl) => {
      const list = lists[listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl).catch((error) =>
          logger.debug('lists/updater', 'Updater', 'list added fetching error', error),
        )
      }
    })
    DEFAULT_INACTIVE_LIST_URLS.forEach((listUrl) => {
      const list = lists[listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl, /* isUnsupportedList= */ true).catch((error) =>
          logger.debug('lists/updater', 'Updater', 'list added fetching error', error),
        )
      }
    })
  }, [fetchList, lists, rehydrated])

  // automatically update lists for every version update
  useEffect(() => {
    if (!rehydrated) {
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
