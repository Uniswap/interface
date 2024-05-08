import { useWeb3React } from '@web3-react/core'
import { CHAIN_IDS_TO_NAMES, isSupportedChain } from 'constants/chains'
import { ParsedQs } from 'qs'
import { useEffect, useRef } from 'react'
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
  const { chainId, isActive, account } = useWeb3React()
  const parsedQs = useParsedQueryString()
  const chainIdRef = useRef(chainId)
  const accountRef = useRef(account)

  useEffect(() => {
    // Update chainIdRef when the account is retrieved from Web3React
    if (account && account !== accountRef.current) {
      chainIdRef.current = chainId
      accountRef.current = account
    }
  }, [account, chainId])

  const urlChainId = getParsedChainId(parsedQs)

  const selectChain = useSelectChain()

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    // Change a user's chain on pageload if the connected chainId does not match the query param chain
    if (isActive && urlChainId && chainIdRef.current === chainId && chainId !== urlChainId) {
      selectChain(urlChainId)
    }
    // If a user has a connected wallet and has manually changed their chain, update the query parameter if it's supported
    else if (account && chainIdRef.current !== chainId && chainId !== urlChainId) {
      if (isSupportedChain(chainId)) {
        searchParams.set('chain', CHAIN_IDS_TO_NAMES[chainId])
      } else {
        searchParams.delete('chain')
      }
      setSearchParams(searchParams, { replace: true })
    }
    // If a user has a connected wallet and the chainId matches the query param chain, update the chainIdRef
    else if (isActive && chainId === urlChainId) {
      chainIdRef.current = urlChainId
    }
  }, [urlChainId, selectChain, searchParams, isActive, chainId, account, setSearchParams])
}
