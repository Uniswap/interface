import { useEffect } from 'react'
import { api, CHAIN_TAG } from 'state/data/enhanced'
import { useAppDispatch, useAppSelector } from 'state/hooks'

function useQueryCacheInvalidator() {
  const dispatch = useAppDispatch()

  // subscribe to `chainId` changes in the redux store rather than Web3
  // this will ensure that when `invalidateTags` is called, the latest
  // `chainId` is available in redux to build the subgraph url
  const chainId = useAppSelector((state) => state.application.chainId)

  useEffect(() => {
    dispatch(api.util.invalidateTags([CHAIN_TAG]))
  }, [chainId, dispatch])
}

export default function Updater(): null {
  useQueryCacheInvalidator()
  return null
}
