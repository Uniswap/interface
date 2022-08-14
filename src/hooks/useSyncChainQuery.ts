import { useWeb3React } from '@web3-react/core'
import { CHAIN_IDS_TO_NAMES, SupportedChainId } from 'constants/chains'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { replaceURLParam } from 'utils/routes'
import useOnSelectChain from './useOnSelectChain'

import useParsedQueryString from './useParsedQueryString'
import usePrevious from './usePrevious'

const getChainIdFromName = (name: string) => {
  const entry = Object.entries(CHAIN_IDS_TO_NAMES).find(([_, n]) => n === name)
  const chainId = entry?.[0]
  return chainId ? parseInt(chainId) : undefined
}

const getParsedChainId = (parsedQs?: ParsedQs) => {
  const chain = parsedQs?.chain
  if (!chain || typeof chain !== 'string') return

  return getChainIdFromName(chain)
}

const getChainNameFromId = (id: string | number) => {
  // casting here may not be right but fine to return undefined if it's not a supported chain ID
  return CHAIN_IDS_TO_NAMES[id as SupportedChainId] || ''
}

export default function useSyncChainQuery() {
  const { chainId, isActive } = useWeb3React()
  const navigate = useNavigate()
  const { search } = useLocation()
  const parsedQs = useParsedQueryString()

  const urlChainId = getParsedChainId(parsedQs)
  const previousUrlChainId = usePrevious(urlChainId)

  const onSelectChain = useOnSelectChain()

  // Can't use `usePrevious` because `chainId` can be undefined while activating.
  const [previousChainId, setPreviousChainId] = useState<number | undefined>(undefined)
  useEffect(() => {
    if (chainId && chainId !== previousChainId) {
      setPreviousChainId(chainId)
    }
  }, [chainId, previousChainId])

  const replaceURLChainParam = useCallback(() => {
    if (chainId) {
      navigate({ search: replaceURLParam(search, 'chain', getChainNameFromId(chainId)) }, { replace: true })
    }
  }, [chainId, search, navigate])

  return useEffect(() => {
    const chainQueryUnpopulated = !urlChainId
    const chainChanged = chainId !== previousChainId
    const chainQueryStale = urlChainId !== chainId
    const chainQueryManuallyUpdated = urlChainId && urlChainId !== previousUrlChainId

    if (chainQueryUnpopulated && chainId) {
      // If there is no chain query param, set it to the current chain
      replaceURLChainParam()
    } else if (chainChanged && chainQueryStale) {
      // If the chain changed but the query param is stale, update to the current chain
      replaceURLChainParam()
    } else if (chainQueryManuallyUpdated && isActive) {
      // If the query param changed, and the chain didn't change, then activate the new chain
      onSelectChain(urlChainId)
    }
  }, [onSelectChain, urlChainId, previousUrlChainId, isActive, chainId, previousChainId, replaceURLChainParam])
}
