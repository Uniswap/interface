import { nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { getNetworkLibrary } from '../connectors'
import { AppDispatch } from '../state'
import { fetchTokenList } from '../state/lists/actions'
import getTokenList from '../utils/getTokenList'
import resolveENSContentHash from '../utils/resolveENSContentHash'
import { useActiveWeb3React } from './index'
import { ChainId } from '@multiswap/sdk'

export function useFetchListCallback(): (listUrl: string) => Promise<TokenList> {
  const { chainId, library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()

  const ensResolver = useCallback(
    (ensName: string) => {
      if (!library || chainId !== ChainId.MAINNET) {
        // Not required
        //if (NETWORK_CHAIN_ID === ChainId.MAINNET) {
        const networkLibrary = getNetworkLibrary()
        if (networkLibrary) {
          return resolveENSContentHash(ensName, networkLibrary)
        }
        //}
        throw new Error('Could not construct mainnet ENS resolver')
      }
      return resolveENSContentHash(ensName, library)
    },
    [chainId, library]
  )

  return useCallback(
    async (listUrl: string) => {
      const requestId = nanoid()
      dispatch(fetchTokenList.pending({ requestId, url: listUrl }))
      return getTokenList(listUrl, ensResolver)
        .then(tokenList => {
          dispatch(fetchTokenList.fulfilled({ url: listUrl, tokenList, requestId }))
          return tokenList
        })
        .catch(error => {
          console.debug(`Failed to get list at url ${listUrl}`, error)
          dispatch(fetchTokenList.rejected({ url: listUrl, requestId, errorMessage: error.message }))
          throw error
        })
    },
    [dispatch, ensResolver]
  )
}
