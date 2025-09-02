import { nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { RPC_PROVIDERS } from 'constants/providers'
import getTokenList from 'lib/hooks/useTokenList/fetchTokenList'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'
import { fetchTokenList } from 'state/lists/actions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'

export function useFetchListCallback(): (listUrl: string, skipValidation?: boolean) => Promise<TokenList> {
  const dispatch = useAppDispatch()

  return useCallback(
    async (listUrl: string, skipValidation?: boolean) => {
      const requestId = nanoid()
      dispatch(fetchTokenList.pending({ requestId, url: listUrl }))
      return getTokenList({
        listUrl,
        resolveENSContentHash: (ensName: string) =>
          resolveENSContentHash(ensName, RPC_PROVIDERS[UniverseChainId.Mainnet]),
        skipValidation,
      })
        .then((tokenList) => {
          dispatch(fetchTokenList.fulfilled({ url: listUrl, tokenList, requestId }))
          return tokenList
        })
        .catch((error) => {
          logger.debug('useFetchListCallback', 'useFetchListCallback', 'Failed to fetch list', { error, listUrl })
          dispatch(fetchTokenList.rejected({ url: listUrl, requestId, errorMessage: error.message }))
          throw error
        })
    },
    [dispatch],
  )
}
