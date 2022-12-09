import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { AppDispatch } from 'state'
import { getTokenList } from 'utils/getTokenList'

import { setTokenList } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    ;[...MAINNET_NETWORKS, ChainId.GÖRLI].forEach(chainId => {
      const listUrl = NETWORKS_INFO[chainId].tokenListUrl
      getTokenList(listUrl, chainId)
        .then(tokenList => {
          dispatch(setTokenList({ chainId, tokenList }))
        })
        .catch(error => {
          console.error(`Failed to get list at url ${listUrl}`, error)
        })
    })
  }, [dispatch])

  return null
}
