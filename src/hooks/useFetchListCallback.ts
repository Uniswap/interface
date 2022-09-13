import { nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import getTokenList from 'lib/hooks/useTokenList/fetchTokenList'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'

import { fetchTokenList } from '../state/lists/actions'

export function useFetchListCallback(): (listUrl: string, sendDispatch?: boolean) => Promise<TokenList> {
  const dispatch = useAppDispatch()

  // note: prevent dispatch if using for list search or unsupported list
  return useCallback(
    async (listUrl: string, sendDispatch = true) => {
      const requestId = nanoid()
      sendDispatch && dispatch(fetchTokenList.pending({ requestId, url: listUrl }))
      return getTokenList(listUrl, (ensName: string) =>
        resolveENSContentHash(ensName, RPC_PROVIDERS[SupportedChainId.MAINNET])
      )
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
    [dispatch]
  )
}
