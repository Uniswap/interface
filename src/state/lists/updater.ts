import { getVersionUpgrade, minVersionBump, VersionUpgrade } from '@uniswap/token-lists'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DEFAULT_TOKEN_LIST_URL } from '../../constants'
import { addPopup } from '../application/actions'
import { AppDispatch, AppState } from '../index'
import { acceptListUpdate, addList, fetchTokenList } from './actions'

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
