import { Web3Provider } from '@ethersproject/providers'
import { nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { networkHooks } from 'connectors'
import getTokenList from 'lib/hooks/useTokenList/fetchTokenList'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'

import { fetchTokenList } from '../state/lists/actions'

const ensResolver = async (ensName: string, provider: Web3Provider | undefined, isActive: boolean) => {
  if (!provider || !isActive) {
    throw Error('network is inactive')
  }
  return resolveENSContentHash(ensName, provider)
}

export function useFetchListCallback(): (listUrl: string, sendDispatch?: boolean) => Promise<TokenList> {
  const dispatch = useAppDispatch()
  const provider = networkHooks.useProvider()
  const isActive = networkHooks.useIsActive()

  // note: prevent dispatch if using for list search or unsupported list
  return useCallback(
    async (listUrl: string, sendDispatch = true) => {
      const requestId = nanoid()
      sendDispatch && dispatch(fetchTokenList.pending({ requestId, url: listUrl }))
      return getTokenList(listUrl, (ensName: string) => ensResolver(ensName, provider, isActive))
        .then((tokenList) => {
          sendDispatch && dispatch(fetchTokenList.fulfilled({ url: listUrl, tokenList, requestId }))
          return tokenList
        })
        .catch((error) => {
          console.debug(`Failed to get list at url ${listUrl}`, error)
          sendDispatch && dispatch(fetchTokenList.rejected({ url: listUrl, requestId, errorMessage: error.message }))
          throw error
        })
    },
    [dispatch, isActive, provider]
  )
}
