import { useState, useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'

import FACTORY_ABI from '../abi/factory'
import {
  getSignerOrProvider,
  getContract,
  getEtherBalance,
  getTokenBalance,
  getExchangeDetails,
  getTokenAllowance,
  getExchangeReserves,
  getTokenDecimals
} from '../utils'

const FACTORY_ADDRESSES = {
  1: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
  4: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36'
}

// generic hooks
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

// slightly less generic hooks
export function useSignerOrProvider() {
  const { library, account } = useWeb3Context()

  return useMemo(() => getSignerOrProvider(library, account), [library, account])
}

function useBlockEffect(effect) {
  const { library } = useWeb3Context()

  // run every block
  useEffect(() => {
    library.on('block', effect)
    return () => {
      library.removeListener('block', effect)
    }
  }, [library, effect])
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

// more specific hooks
export function useFactoryContract() {
  const { networkId } = useWeb3Context()

  return useContract(FACTORY_ADDRESSES[networkId], FACTORY_ABI)
}

// returns the exchange address for a token, from the uniswap factory
export function useExchangeDetails(tokenAddress) {
  const { networkId } = useWeb3Context()
  const signerOrProvider = useSignerOrProvider()

  const [exchangeDetails, setExchangeDetails] = useState()

  useEffect(() => {
    let stale = false

    getExchangeDetails(networkId, tokenAddress, signerOrProvider)
      .then(({ exchangeAddress }) => {
        if (!stale) {
          setExchangeDetails(exchangeAddress)
        }
      })
      .catch(() => {})

    return () => {
      stale = true
      setExchangeDetails()
    }
  }, [networkId, tokenAddress, signerOrProvider])

  return exchangeDetails
}

// returns the allowance
export function useAllowance(tokenAddress, spenderAddress) {
  const { account } = useWeb3Context()
  const signerOrProvider = useSignerOrProvider()

  const [allowance, setAllowance] = useState(tokenAddress === 'ETH' ? ethers.constants.MaxUint256 : undefined)

  const updateAllowance = useCallback(() => {
    if (tokenAddress === 'ETH') {
      setAllowance(ethers.constants.MaxUint256)
    } else {
      let stale = false

      getTokenAllowance(tokenAddress, account, spenderAddress, signerOrProvider)
        .then(allowance => {
          if (!stale) {
            setAllowance(allowance)
          }
        })
        .catch(() => {})

      return () => {
        stale = true
        setAllowance()
      }
    }
  }, [tokenAddress, account, spenderAddress, signerOrProvider])

  useEffect(updateAllowance, [updateAllowance])
  useBlockEffect(updateAllowance)

  return allowance
}

export function useBalance(tokenAddress) {
  const { library, account } = useWeb3Context()
  const signerOrProvider = useSignerOrProvider()

  const [balance, setBalance] = useState()

  const updateBalance = useCallback(() => {
    let stale = false
    const balancePromise =
      tokenAddress === 'ETH'
        ? getEtherBalance(library, account)
        : getTokenBalance(tokenAddress, account, signerOrProvider)

    balancePromise
      .then(balance => {
        if (!stale) {
          setBalance(balance)
        }
      })
      .catch(() => {})

    return () => {
      stale = true
      setBalance()
    }
  }, [tokenAddress, library, account, signerOrProvider])

  useEffect(updateBalance, [updateBalance])
  useBlockEffect(updateBalance)

  return balance
}

export function useTokenDecimals(tokenAddress) {
  const signerOrProvider = useSignerOrProvider()

  const [decimals, setDecimals] = useState(tokenAddress === 'ETH' ? 18 : undefined)

  useEffect(() => {
    if (tokenAddress === 'ETH') {
      setDecimals(18)
    } else {
      let stale = false

      getTokenDecimals(tokenAddress, signerOrProvider)
        .then(decimals => {
          if (!stale) {
            setDecimals(decimals)
          }
        })
        .catch(() => {})

      return () => {
        stale = true
        setDecimals()
      }
    }
  }, [tokenAddress, signerOrProvider])

  return decimals
}

const initialReserves = { reserveETH: undefined, reserveToken: undefined }
export function useExchangeReserves(exchangeAddress, tokenAddress) {
  const { library } = useWeb3Context()
  const signerOrProvider = useSignerOrProvider()

  const [reserves, setReserves] = useState(initialReserves)

  const updateReserves = useCallback(() => {
    let stale = false

    getExchangeReserves(library, exchangeAddress, tokenAddress, signerOrProvider)
      .then(({ reserveETH, reserveToken }) => {
        if (!stale) {
          setReserves({ reserveETH, reserveToken })
        }
      })
      .catch(() => {})

    return () => {
      stale = true
      setReserves(initialReserves)
    }
  }, [library, exchangeAddress, tokenAddress, signerOrProvider])

  useEffect(updateReserves, [updateReserves])
  useBlockEffect(updateReserves)

  return reserves
}
