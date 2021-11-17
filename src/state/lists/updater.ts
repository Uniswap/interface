import { useAllLists } from './hooks'
import { getVersionUpgrade, minVersionBump, VersionUpgrade } from '@uniswap/token-lists'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useFetchCarrotListCallback, useFetchListCallback } from '../../hooks/useFetchListCallback'
import useInterval from '../../hooks/useInterval'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { AppDispatch } from '../index'
import { acceptListUpdate } from './actions'
import { useActiveListUrls } from './hooks'
import { UNSUPPORTED_LIST_URLS } from '../../constants/lists'
import { useActiveWeb3React } from '../../hooks'

export default function Updater(): null {
  const { library, chainId, account } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const isWindowVisible = useIsWindowVisible()

  // get all loaded lists, and the active urls
  const lists = useAllLists()
  const activeListUrls = useActiveListUrls()

  const fetchList = useFetchListCallback()
  const fetchCarrotList = useFetchCarrotListCallback()

  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible || !chainId) return
    Object.keys(lists).forEach(url => {
      fetchList(url).catch((error: Error) => console.debug('interval list fetching error', error))
    })
    fetchCarrotList().catch((error: Error) => console.debug('interval list fetching error', error))
  }, [isWindowVisible, chainId, lists, fetchCarrotList, fetchList])

  // fetch all lists every 10 minutes, but only after we initialize library
  useInterval(fetchAllListsCallback, library ? 1000 * 60 * 10 : null)

  useEffect(() => {
    if (account) {
      const carrotList = lists['CARROT']
      if (carrotList && !carrotList.current && !carrotList.loadingRequestId && !carrotList.error) {
        fetchCarrotList().catch((error: Error) => console.debug('list added fetching error', error))
      }
    }
  }, [account, fetchCarrotList, lists])

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(lists)
      .filter(listUrl => listUrl !== 'CARROT')
      .forEach(listUrl => {
        const list = lists[listUrl]
        if (!list.current && !list.loadingRequestId && !list.error) {
          fetchList(listUrl).catch((error: Error) => console.debug('list added fetching error', error))
        }
      })
    const carrotList = lists['CARROT']
    if (carrotList && !carrotList.current && !carrotList.loadingRequestId && !carrotList.error) {
      fetchCarrotList().catch((error: Error) => console.debug('list added fetching error', error))
    }
  }, [dispatch, fetchCarrotList, fetchList, library, lists])

  // if any lists from unsupported lists are loaded, check them too (in case new updates since last visit)
  useEffect(() => {
    UNSUPPORTED_LIST_URLS.forEach(listUrl => {
      const list = lists[listUrl]
      if (!list || (!list.current && !list.loadingRequestId && !list.error)) {
        fetchList(listUrl).catch((error: Error) => console.debug('list added fetching error', error))
      }
    })
  }, [chainId, dispatch, fetchList, library, lists])

  // automatically update lists if versions are minor/patch
  useEffect(() => {
    Object.keys(lists).forEach(listUrl => {
      const list = lists[listUrl]
      if (list.current && list.pendingUpdate) {
        const bump = getVersionUpgrade(list.current.version, list.pendingUpdate.version)
        switch (bump) {
          case VersionUpgrade.NONE:
            throw new Error('unexpected no version bump')
          case VersionUpgrade.PATCH:
          case VersionUpgrade.MINOR:
            const min = minVersionBump(list.current.tokens, list.pendingUpdate.tokens)
            // automatically update minor/patch as long as bump matches the min update
            if (bump >= min) {
              dispatch(acceptListUpdate(listUrl))
            } else {
              console.error(
                `List at url ${listUrl} could not automatically update because the version bump was only PATCH/MINOR while the update had breaking changes and should have been MAJOR`
              )
            }
            break

          // update any active or inactive lists
          case VersionUpgrade.MAJOR:
            dispatch(acceptListUpdate(listUrl))
        }
      }
    })
  }, [dispatch, lists, activeListUrls])

  return null
}
