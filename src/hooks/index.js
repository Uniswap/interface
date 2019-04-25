import { useMemo, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'

import FACTORY_ABI from '../abi/factory'
import { getSignerOrProvider, getContract } from '../utils'

const factoryAddresses = {
  1: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
  4: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36'
}

export function useSignerOrProvider() {
  const { library, account } = useWeb3Context()

  return useMemo(() => getSignerOrProvider(library, account), [library, account])
}

// returns null if the contract cannot be created for any reason
function useContract(contractAddress, ABI) {
  const signerOrProvider = useSignerOrProvider()

  return useMemo(() => {
    try {
      return getContract(contractAddress, ABI, signerOrProvider)
    } catch {
      return null
    }
  }, [contractAddress, ABI, signerOrProvider])
}

export function useFactoryContract() {
  const { networkId } = useWeb3Context()

  return useContract(factoryAddresses[networkId], FACTORY_ABI)
}

// modified from https://usehooks.com/useKeyPress/
export function useBodyKeyDown(targetKey, onKeyDown, suppressOnKeyDown = false) {
  function downHandler({ target: { tagName }, key }) {
    if (key === targetKey && tagName === 'BODY' && !suppressOnKeyDown) {
      onKeyDown()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    return () => {
      window.removeEventListener('keydown', downHandler)
    }
  }, [targetKey, onKeyDown, suppressOnKeyDown])
}
