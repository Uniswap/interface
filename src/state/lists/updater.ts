import { getVersionUpgrade, minVersionBump, VersionUpgrade } from '@fuseio/token-lists'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useFetchListCallback } from '../../hooks/useFetchListCallback'
import useInterval from '../../hooks/useInterval'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { addPopup } from '../application/actions'
import { AppDispatch, AppState } from '../index'
import { acceptListUpdate } from './actions'

export default function Updater(): null {
  const { library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const swapLists = useSelector<AppState, AppState['lists']['Swap']['byUrl']>(state => state.lists.Swap.byUrl)
  const bridgeLists = useSelector<AppState, AppState['lists']['Bridge']['byUrl']>(state => state.lists.Bridge.byUrl)

  const isWindowVisible = useIsWindowVisible()

  const fetchList = useFetchListCallback()

  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) return
    Object.keys(swapLists).forEach(url =>
      fetchList(url, 'Swap').catch(error => console.debug('interval swap list fetching error', error))
    )
    Object.keys(bridgeLists).forEach(url =>
      fetchList(url, 'Bridge').catch(error => console.debug('interval swap list fetching error', error))
    )
  }, [fetchList, isWindowVisible, swapLists, bridgeLists])

  // fetch all lists every 10 minutes, but only after we initialize library
  useInterval(fetchAllListsCallback, library ? 1000 * 60 * 10 : null)

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(swapLists).forEach(listUrl => {
      const list = swapLists[listUrl]

      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl, 'Swap').catch(error => console.debug('list added fetching error', error))
      }
    })

    Object.keys(bridgeLists).forEach(listUrl => {
      const list = bridgeLists[listUrl]

      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl, 'Bridge').catch(error => console.debug('list added fetching error', error))
      }
    })
  }, [dispatch, fetchList, library, swapLists, bridgeLists])

  // automatically update lists if versions are minor/patch
  useEffect(() => {
    Object.keys(swapLists).forEach(listUrl => {
      const list = swapLists[listUrl]
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
              dispatch(acceptListUpdate({ url: listUrl, listType: 'Swap' }))
              dispatch(
                addPopup({
                  key: listUrl,
                  content: {
                    listUpdate: {
                      listUrl,
                      oldList: list.current,
                      newList: list.pendingUpdate,
                      auto: true,
                      listType: 'Swap'
                    }
                  }
                })
              )
            } else {
              console.error(
                `List at url ${listUrl} could not automatically update because the version bump was only PATCH/MINOR while the update had breaking changes and should have been MAJOR`
              )
            }
            break

          case VersionUpgrade.MAJOR:
            dispatch(
              addPopup({
                key: listUrl,
                content: {
                  listUpdate: {
                    listUrl,
                    auto: false,
                    oldList: list.current,
                    newList: list.pendingUpdate,
                    listType: 'Swap'
                  }
                },
                removeAfterMs: null
              })
            )
        }
      }
    })

    Object.keys(bridgeLists).forEach(listUrl => {
      const list = bridgeLists[listUrl]
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
              dispatch(acceptListUpdate({ url: listUrl, listType: 'Bridge' }))
              dispatch(
                addPopup({
                  key: listUrl,
                  content: {
                    listUpdate: {
                      listUrl,
                      oldList: list.current,
                      newList: list.pendingUpdate,
                      auto: true,
                      listType: 'Bridge'
                    }
                  }
                })
              )
            } else {
              console.error(
                `List at url ${listUrl} could not automatically update because the version bump was only PATCH/MINOR while the update had breaking changes and should have been MAJOR`
              )
            }
            break

          case VersionUpgrade.MAJOR:
            dispatch(
              addPopup({
                key: listUrl,
                content: {
                  listUpdate: {
                    listUrl,
                    auto: false,
                    oldList: list.current,
                    newList: list.pendingUpdate,
                    listType: 'Bridge'
                  }
                },
                removeAfterMs: null
              })
            )
        }
      }
    })
  }, [dispatch, swapLists, bridgeLists])

  return null
}
