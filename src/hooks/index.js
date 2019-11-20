import { useState, useMemo, useCallback, useEffect } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { useWalletModalContext } from '../contexts/Wallet'
import { injected, network } from '../connectors'

import ERC20_ABI from '../constants/abis/erc20'
import { getContract, getFactoryContract, getExchangeContract, isAddress } from '../utils'
import copy from 'copy-to-clipboard'

export function useEagerConnect() {
  const { activate, setError, active } = useWeb3React()

  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then(isAuthorized => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(error => {
          setTried(true)
        })
      } else {
        activate(network)
        setTried(true)
      }
    })
  }, [activate, setError]) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (!tried && active) {
      setTried(true)
    }
  }, [tried, active])

  return tried
}

/**
 * Use for network and injected - logs user in
 * and out after checking what network theyre on
 */
export function useInactiveListener(suppress = false) {
  const { error, connector, activate } = useWeb3React()
  const [{ setWalletError }] = useWalletModalContext()

  useEffect(() => {
    const { ethereum } = window
    // need to watch for switching to bad network, or switching to back to good network
    if (ethereum && !error && !suppress && ethereum.on) {
      const handleNetworkChanged = () => {
        activate(injected, undefined, true).catch(error => {
          activate(network)
          if (error instanceof UnsupportedChainIdError) {
            setWalletError(error)
          }
        })
        setWalletError() // reset error on modal
      }
      const handleAccountsChanged = accounts => {
        if (accounts.length > 0) {
          activate(injected)
          setWalletError() // reset error on modal
        }
      }
      ethereum.on('networkChanged', handleNetworkChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)
      return () => {
        ethereum.removeListener('networkChanged', handleNetworkChanged)
        ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }

    return () => {}
  }, [error, suppress, activate, connector, setWalletError])
}

// modified from https://usehooks.com/useDebounce/
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on delay change or unmount)
    // This is how we prevent debounced value from updating if value is changed ...
    // .. within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// modified from https://usehooks.com/useKeyPress/
export function useBodyKeyDown(targetKey, onKeyDown, suppressOnKeyDown = false) {
  const downHandler = useCallback(
    event => {
      const {
        target: { tagName },
        key
      } = event
      if (key === targetKey && tagName === 'BODY' && !suppressOnKeyDown) {
        event.preventDefault()
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

export function useENSName(address) {
  const { library } = useWeb3React()

  const [ENSName, setENSName] = useState()

  useEffect(() => {
    if (isAddress(address)) {
      let stale = false
      try {
        library.lookupAddress(address).then(name => {
          if (!stale) {
            if (name) {
              setENSName(name)
            } else {
              setENSName(null)
            }
          }
        })
      } catch {
        setENSName(null)
      }

      return () => {
        stale = true
        setENSName()
      }
    }
  }, [library, address])

  return ENSName
}

// returns null on errors
export function useContract(address, ABI, withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

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
  const { library, account } = useWeb3React()

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
  const { networkId, library, account } = useWeb3React()

  return useMemo(() => {
    try {
      return getFactoryContract(networkId, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [networkId, library, withSignerIfPossible, account])
}

export function useExchangeContract(exchangeAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    try {
      return getExchangeContract(exchangeAddress, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [exchangeAddress, library, withSignerIfPossible, account])
}

export function useCopyClipboard(timeout = 500) {
  const [isCopied, setIsCopied] = useState(false)

  const staticCopy = useCallback(text => {
    const didCopy = copy(text)
    setIsCopied(didCopy)
  }, [])

  useEffect(() => {
    if (isCopied) {
      const hide = setTimeout(() => {
        setIsCopied(false)
      }, timeout)

      return () => {
        clearTimeout(hide)
      }
    }
  }, [isCopied, setIsCopied, timeout])

  return [isCopied, staticCopy]
}
