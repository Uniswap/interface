import { useWeb3React } from '@web3-react/core'
import { CHAIN_IDS_TO_NAMES } from 'constants/chains'
import { ParsedQs } from 'qs'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import useParsedQueryString from './useParsedQueryString'
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

  const selectChain = useSelectChain()

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (isActive && urlChainId && chainId !== urlChainId) {
      selectChain(urlChainId)
    }
  }, [urlChainId, selectChain, searchParams, setSearchParams, isActive, chainId])
}
