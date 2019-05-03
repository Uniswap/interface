import { useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'

import ERC20_ABI from '../abi/erc20'
import { getContract, getFactoryContract, getExchangeContract } from '../utils'

// modified from https://usehooks.com/useKeyPress/
export function useBodyKeyDown(targetKey, onKeyDown, suppressOnKeyDown = false) {
  const downHandler = useCallback(
    ({ target: { tagName }, key }) => {
      if (key === targetKey && tagName === 'BODY' && !suppressOnKeyDown) {
        onKeyDown()
      }
    },
    [targetKey, onKeyDown, suppressOnKeyDown]
  )

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    return () => {
      window.removeEventListener('keydown', downHandler)
    }
  }, [downHandler])
}

export function useBlockEffect(functionToRun) {
  const { library } = useWeb3Context()

  useEffect(() => {
    if (library) {
      function wrappedEffect(blockNumber) {
        functionToRun(blockNumber)
      }
      library.on('block', wrappedEffect)
      return () => {
        library.removeListener('block', wrappedEffect)
      }
    }
  }, [library, functionToRun])
}

// returns null on errors
export function useContract(address, ABI, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getContract(address, ABI, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

// returns null on errors
export function useTokenContract(tokenAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getContract(tokenAddress, ERC20_ABI, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [tokenAddress, library, withSignerIfPossible, account])
}

// returns null on errors
export function useFactoryContract(withSignerIfPossible = true) {
  const { networkId, library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getFactoryContract(networkId, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [networkId, library, withSignerIfPossible, account])
}

export function useExchangeContract(exchangeAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getExchangeContract(exchangeAddress, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [exchangeAddress, library, withSignerIfPossible, account])
}
