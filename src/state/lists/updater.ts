import { useEffect } from 'react'
import { useActiveWeb3React } from '../../hooks'
import { setTokenList } from './actions'
import { useDispatch } from 'react-redux'
import { Fetcher, TokenList } from 'dxswap-sdk'

export default function Updater() {
  const { chainId, library } = useActiveWeb3React()
  const dispatch = useDispatch()

  useEffect(() => {
    if (chainId)
      Fetcher.fetchDxDaoTokenList(chainId, library)
        .then((tokenList: TokenList) => {
          if (tokenList) dispatch(setTokenList(tokenList))
        })
        .catch(error => {
          console.error('Error fetching the default token list. error:', error)
          return
        })
  }, [chainId, dispatch, library])

  return null
}
