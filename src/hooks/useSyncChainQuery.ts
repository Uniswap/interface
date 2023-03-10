import { useWeb3React } from '@web3-react/core'
import { CHAIN_IDS_TO_NAMES } from 'constants/chains'
import { ParsedQs } from 'qs'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import useParsedQueryString from './useParsedQueryString'
import usePrevious from './usePrevious'
import useSelectChain from './useSelectChain'

function getChainIdFromName(name: string) {
  const entry = Object.entries(CHAIN_IDS_TO_NAMES).find(([, n]) => n === name)
  const chainId = entry?.[0]
  return chainId ? parseInt(chainId) : undefined
}

function getParsedChainId(parsedQs?: ParsedQs) {
  const chain = parsedQs?.chain
  if (!chain || typeof chain !== 'string') return

  return getChainIdFromName(chain)
}

export default function useSyncChainQuery() {
  const { chainId, isActive } = useWeb3React()
  const parsedQs = useParsedQueryString()

  const urlChainId = getParsedChainId(parsedQs)
  const previousUrlChainId = usePrevious(urlChainId)

  const selectChain = useSelectChain()

  // Can't use `usePrevious` because `chainId` can be undefined while activating.
  const [previousChainId, setPreviousChainId] = useState<number | undefined>(undefined)
  useEffect(() => {
    if (chainId && chainId !== previousChainId) {
      setPreviousChainId(chainId)
    }
  }, [chainId, previousChainId])

  const [searchParams, setSearchParams] = useSearchParams()

  const chainQueryManuallyUpdated = urlChainId && urlChainId !== previousUrlChainId && isActive

  return useEffect(() => {
    if (chainQueryManuallyUpdated) {
      // If the query param changed, and the chain didn't change, then activate the new chain
      selectChain(urlChainId)
      searchParams.delete('chain')
      setSearchParams(searchParams)
    }
  }, [chainQueryManuallyUpdated, urlChainId, selectChain, searchParams, setSearchParams])
}
