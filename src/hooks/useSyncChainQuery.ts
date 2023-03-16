import { useWeb3React } from '@web3-react/core'
import { CHAIN_IDS_TO_NAMES } from 'constants/chains'
import { ParsedQs } from 'qs'
import { useEffect, useState } from 'react'

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
  const parsedQs = useParsedQueryString()
  const urlChainId = getParsedChainId(parsedQs)
  const [nextChainId, setNextChainId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (urlChainId) {
      setNextChainId(urlChainId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectChain = useSelectChain()
  const { isActive } = useWeb3React()
  return useEffect(() => {
    console.log(nextChainId, isActive)
    if (nextChainId && isActive) {
      selectChain(nextChainId)
    }
  }, [isActive, nextChainId, selectChain])
}
