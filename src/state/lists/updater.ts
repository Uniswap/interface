import { getVersionUpgrade, minVersionBump, VersionUpgrade } from '@uniswap/token-lists'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useInterval from '../../hooks/useInterval'
import { addPopup } from '../application/actions'
import { AppDispatch, AppState } from '../index'
import { acceptListUpdate, fetchTokenList } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)

  const fetchAllListsCallback = useCallback(() => {
    Object.keys(lists).forEach(listUrl => dispatch(fetchTokenList(listUrl) as any))
  }, [dispatch, lists])
  // refetch all lists every 10 minutes
  useInterval(fetchAllListsCallback, 1000 * 60 * 10)

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(lists).forEach(listUrl => {
      const list = lists[listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        dispatch(fetchTokenList(listUrl) as any)
      }
    })
  }, [dispatch, lists])

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
          case VersionUpgrade.MAJOR:
            const min = minVersionBump(list.current.tokens, list.pendingUpdate.tokens)
            // automatically update minor/patch as long as bump matches the min update
            if (bump >= min) {
              dispatch(acceptListUpdate(listUrl))
              dispatch(
                addPopup({
                  key: listUrl,
                  content: {
                    listUpdate: {
                      listUrl,
                      oldList: list.current,
                      newList: list.pendingUpdate,
                      auto: true
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

          // this will be turned on later
          // case VersionUpgrade.MAJOR:
          // dispatch(
          //   addPopup({
          //     key: listUrl,
          //     content: {
          //       listUpdate: {
          //         listUrl,
          //         auto: false,
          //         oldList: list.current,
          //         newList: list.pendingUpdate
          //       }
          //     }
          //   })
          // )
        }
      }
    })
  }, [dispatch, lists])

  return null
}
