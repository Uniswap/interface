import React, { Component, createContext, useContext, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'

import { useBlockEffect } from '../hooks'

const ApplicationContext = createContext()

export default class Provider extends Component {
  constructor(props) {
    super(props)

    this.dismissBetaMessage = () => {
      this.setState({ showBetaMessage: false })
    }

    this.updateBlockNumber = blockNumber => {
      this.setState({ blockNumber })
    }

    this.state = {
      showBetaMessage: true,
      dismissBetaMessage: this.dismissBetaMessage,
      blockNumber: undefined,
      updateBlockNumber: this.updateBlockNumber
    }
  }

  render() {
    return <ApplicationContext.Provider value={this.state}>{this.props.children}</ApplicationContext.Provider>
  }
}

export function useApplicationContext() {
  return useContext(ApplicationContext)
}

export function Updater() {
  const { library } = useWeb3Context()
  const { updateBlockNumber } = useApplicationContext()

  // fetch the block number once on load...
  useEffect(() => {
    if (library) {
      let stale = false

      library
        .getBlockNumber()
        .then(blockNumber => {
          if (!stale) {
            updateBlockNumber(blockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            updateBlockNumber(null)
          }
        })

      return () => {
        stale = true
        // this clears block number on network change because the library has changed
        updateBlockNumber(undefined)
      }
    }
  }, [library, updateBlockNumber])

  // ...and every block...
  useBlockEffect(updateBlockNumber)

  return null
}

export function useBlockNumber() {
  const { blockNumber } = useApplicationContext()
  return blockNumber
}
