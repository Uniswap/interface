import React, { Component, createContext, useContext, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import merge from 'lodash.merge'

import { getEtherBalance, getTokenBalance, getTokenAllowance, isAddress } from '../utils'
import { useBlockNumber } from './Application'
import { useTokenDetails } from './Static'

// define constants
const BALANCE = 'balance'

const ALLOWANCE = 'allowance'

// node creation
function createAddressValueNode(name, value, blockNumber) {
  return { [name]: value, blockNumber }
}

// tree creation
function createAddressBalanceTree(address, tokenAddress, value, blockNumber) {
  return { [address]: { [tokenAddress]: createAddressValueNode(BALANCE, value, blockNumber) } }
}

function createAddressAllowanceTree(address, tokenAddress, spenderAddress, value, blockNumber) {
  return {
    [address]: { [tokenAddress]: { [spenderAddress]: createAddressValueNode(ALLOWANCE, value, blockNumber) } }
  }
}

// create contexts
const AddressBalanceContext = createContext()

const AddressAllowanceContext = createContext()

// define providers
class AddressBalanceContextProvider extends Component {
  constructor(props) {
    super(props)

    this.getValue = (address, tokenAddress) => {
      return this.state[BALANCE][address] && this.state[BALANCE][address][tokenAddress]
        ? this.state[BALANCE][address][tokenAddress]
        : createAddressValueNode(BALANCE)
    }

    this.updateValue = (address, tokenAddress, value, blockNumber) => {
      this.setState(state => ({
        [BALANCE]: merge(state[BALANCE], createAddressBalanceTree(address, tokenAddress, value, blockNumber))
      }))
    }

    this.clearValues = () => {
      this.setState({ [BALANCE]: {} })
    }

    this.state = {
      [BALANCE]: {},
      getValue: this.getValue,
      updateValue: this.updateValue,
      clearValues: this.clearValues
    }
  }

  render() {
    return <AddressBalanceContext.Provider value={this.state}>{this.props.children}</AddressBalanceContext.Provider>
  }
}

class AddressAllowanceContextProvider extends Component {
  constructor(props) {
    super(props)

    this.getValue = (address, tokenAddress, spenderAddress) => {
      return this.state[ALLOWANCE][address] &&
        this.state[ALLOWANCE][address][tokenAddress] &&
        this.state[ALLOWANCE][address][tokenAddress][spenderAddress]
        ? this.state[ALLOWANCE][address][tokenAddress][spenderAddress]
        : createAddressValueNode(ALLOWANCE)
    }

    this.updateValue = (address, tokenAddress, spenderAddress, value, blockNumber) => {
      this.setState(state => ({
        [ALLOWANCE]: merge(
          state[ALLOWANCE],
          createAddressAllowanceTree(address, tokenAddress, spenderAddress, value, blockNumber)
        )
      }))
    }

    this.clearValues = () => {
      this.setState({ [ALLOWANCE]: {} })
    }

    this.state = {
      [ALLOWANCE]: {},
      getValue: this.getValue,
      updateValue: this.updateValue,
      clearValues: this.clearValues
    }
  }

  render() {
    return <AddressAllowanceContext.Provider value={this.state}>{this.props.children}</AddressAllowanceContext.Provider>
  }
}

export default function Provider({ children }) {
  return (
    <AddressBalanceContextProvider>
      <AddressAllowanceContextProvider>{children}</AddressAllowanceContextProvider>
    </AddressBalanceContextProvider>
  )
}

// define useContext wrappers
function useAddressBalanceContext() {
  return useContext(AddressBalanceContext)
}

function useAddressAllowanceContext() {
  return useContext(AddressAllowanceContext)
}

export function Updater() {
  const { networkId } = useWeb3Context()

  const { clearValues: clearValuesBalance } = useAddressBalanceContext()
  const { clearValues: clearValuesAllowance } = useAddressAllowanceContext()

  useEffect(() => {
    return () => {
      clearValuesBalance()
      clearValuesAllowance()
    }
  }, [clearValuesBalance, clearValuesAllowance, networkId])

  return null
}

// define custom hooks
export function useAddressBalance(address, tokenAddress) {
  const { library } = useWeb3Context()

  const globalBlockNumber = useBlockNumber()

  const { getValue, updateValue } = useAddressBalanceContext()
  const { [BALANCE]: balance, blockNumber: balanceUpdatedBlockNumber } = getValue(address, tokenAddress)

  useEffect(() => {
    // gate this entire effect by checking that the inputs are valid
    if (isAddress(address) && (tokenAddress === 'ETH' || isAddress(tokenAddress))) {
      // if they are, and the balance is undefined or stale, fetch it
      if (balance === undefined || balanceUpdatedBlockNumber !== globalBlockNumber) {
        let stale = false
        ;(tokenAddress === 'ETH' ? getEtherBalance(address, library) : getTokenBalance(tokenAddress, address, library))
          .then(value => {
            if (!stale) {
              updateValue(address, tokenAddress, value, globalBlockNumber)
            }
          })
          .catch(() => {
            if (!stale) {
              updateValue(address, tokenAddress, null, globalBlockNumber)
            }
          })
        return () => {
          stale = true
        }
      }
    }
  }, [address, tokenAddress, balance, balanceUpdatedBlockNumber, globalBlockNumber, library, updateValue])

  return balance
}

export function useAddressAllowance(address, tokenAddress, spenderAddress) {
  const { library } = useWeb3Context()

  const globalBlockNumber = useBlockNumber()

  const { getValue, updateValue } = useAddressAllowanceContext()
  const { [ALLOWANCE]: allowance, blockNumber: allowanceUpdatedBlockNumber } = getValue(
    address,
    tokenAddress,
    spenderAddress
  )

  useEffect(() => {
    // gate this entire effect by checking that the inputs are valid
    if (isAddress(address) && isAddress(tokenAddress) && isAddress(spenderAddress)) {
      // if they are, and the balance is undefined or stale, fetch it
      if (allowance === undefined || allowanceUpdatedBlockNumber !== globalBlockNumber) {
        let stale = false
        getTokenAllowance(address, tokenAddress, spenderAddress, library)
          .then(value => {
            if (!stale) {
              updateValue(address, tokenAddress, spenderAddress, value, globalBlockNumber)
            }
          })
          .catch(() => {
            if (!stale) {
              updateValue(address, tokenAddress, spenderAddress, null, globalBlockNumber)
            }
          })
        return () => {
          stale = true
        }
      }
    }
  }, [
    address,
    tokenAddress,
    spenderAddress,
    allowance,
    allowanceUpdatedBlockNumber,
    globalBlockNumber,
    library,
    updateValue
  ])

  return allowance
}

export function useExchangeReserves(tokenAddress) {
  const { exchangeAddress } = useTokenDetails(tokenAddress)

  const reserveETH = useAddressBalance(exchangeAddress, 'ETH')
  const reserveToken = useAddressBalance(exchangeAddress, tokenAddress)

  return { reserveETH, reserveToken }
}
