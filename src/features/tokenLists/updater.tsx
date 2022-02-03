// Copied from https://github.com/Uniswap/interface/blob/main/src/state/lists/updater.ts

import { getVersionUpgrade, minVersionBump, VersionUpgrade } from '@uniswap/token-lists'
import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { useProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { LIST_INITIAL_FETCH_DELAY, LIST_POLL_DELAY } from 'src/constants/tokenLists/delays'
import { UNSUPPORTED_LIST_URLS } from 'src/constants/tokenLists/tokenLists'
import { acceptListUpdate } from 'src/features/tokenLists/actions'
import { useActiveListUrls, useAllLists } from 'src/features/tokenLists/hooks'
import { useFetchListCallback } from 'src/features/tokenLists/useFetchListCallback'
import { logger } from 'src/utils/logger'
import { useInterval, useTimeout } from 'src/utils/timing'

export function TokenListUpdater() {
  // Delay any list updating to avoid slowing down app init work
  const [isReady, setIsReady] = useState(false)
  useTimeout(() => {
    setIsReady(true)
  }, LIST_INITIAL_FETCH_DELAY)

  const dispatch = useAppDispatch()

  // get all loaded lists, and the active urls
  const lists = useAllLists()
  const activeListUrls = useActiveListUrls()

  const provider = useProvider(ChainId.Mainnet)
  const fetchList = useFetchListCallback(ChainId.Mainnet)
  const fetchAllListsCallback = useCallback(() => {
    if (!provider || !isReady) return
    Object.keys(lists).forEach((url) =>
      fetchList(url).catch((error) =>
        logger.debug(
          'tokenLists/updater',
          'TokenListUpdater',
          'interval list fetching error',
          error
        )
      )
    )
  }, [fetchList, lists, provider, isReady])

  // fetch all lists every interval, but only after we initialize library
  useInterval(fetchAllListsCallback, provider ? LIST_POLL_DELAY : null)

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    if (!provider || !isReady) return
    Object.keys(lists).forEach((listUrl) => {
      const list = lists[listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl).catch((error) =>
          logger.error('tokenLists/updater', 'TokenListUpdater', 'list added fetching error', error)
        )
      }
    })
  }, [dispatch, fetchList, lists, provider, isReady])

  // if any lists from unsupported lists are loaded, check them too (in case new updates since last visit)
  useEffect(() => {
    if (!provider || !isReady) return
    UNSUPPORTED_LIST_URLS.forEach((listUrl) => {
      const list = lists[listUrl]
      if (!list || (!list.current && !list.loadingRequestId && !list.error)) {
        fetchList(listUrl).catch((error) =>
          logger.error('tokenLists/updater', 'TokenListUpdater', 'list added fetching error', error)
        )
      }
    })
  }, [dispatch, fetchList, lists, provider, isReady])

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
          case VersionUpgrade.MINOR:
            const min = minVersionBump(list.current.tokens, list.pendingUpdate.tokens)
            // automatically update minor/patch as long as bump matches the min update
            if (bump >= min) {
              dispatch(acceptListUpdate(listUrl))
            } else {
              logger.error(
                'tokenLists/updater',
                'TokenListUpdater',
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
