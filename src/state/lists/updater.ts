import { nanoid } from '@reduxjs/toolkit'
import { ChainId } from '@uniswap/sdk'
import { getVersionUpgrade, minVersionBump, VersionUpgrade } from '@uniswap/token-lists'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import useInterval from '../../hooks/useInterval'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import getTokenList from '../../utils/getTokenList'
import resolveENSContentHash from '../../utils/resolveENSContentHash'
import { addPopup } from '../application/actions'
import { AppDispatch, AppState } from '../index'
import { acceptListUpdate, fetchTokenList } from './actions'

export default function Updater(): null {
  const { chainId, library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)

  const isWindowVisible = useIsWindowVisible()

  const ensResolver = useCallback(
    (ensName: string) => {
      if (!library) throw new Error('No library')
      if (chainId !== ChainId.MAINNET) throw new Error('Not on mainnet')
      return resolveENSContentHash(ensName, library)
    },
    [chainId, library]
  )

  const fetchList = useMemo(() => {
    return (listUrl: string) => {
      const requestId = nanoid()
      dispatch(fetchTokenList.pending({ requestId, url: listUrl }))
      getTokenList(listUrl, ensResolver)
        .then(tokenList => {
          dispatch(fetchTokenList.fulfilled({ url: listUrl, tokenList, requestId }))
        })
        .catch(error => {
          console.debug(`Failed to get list at url ${listUrl}`, error)
          dispatch(fetchTokenList.rejected({ url: listUrl, requestId, errorMessage: error.message }))
        })
    }
  }, [dispatch, ensResolver])

  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) return
    Object.keys(lists).forEach(fetchList)
  }, [fetchList, isWindowVisible, lists])
  // refetch all lists every 10 minutes
  useInterval(fetchAllListsCallback, library ? 1000 * 60 * 10 : null)

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(lists).forEach(listUrl => {
      const list = lists[listUrl]

      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl)
      }
    })
  }, [dispatch, fetchList, lists])

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

          case VersionUpgrade.MAJOR:
            dispatch(
              addPopup({
                key: listUrl,
                content: {
                  listUpdate: {
                    listUrl,
                    auto: false,
                    oldList: list.current,
                    newList: list.pendingUpdate
                  }
                }
              })
            )
        }
      }
    })
  }, [dispatch, lists])

  return null
}
