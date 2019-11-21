import { AbstractConnector } from '@web3-react/abstract-connector'

export class NoEthereumProviderError extends Error {
  constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'No Ethereum provider was found on window.ethereum.'
  }
}

export class UserRejectedRequestError extends Error {
  constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

export class InjectedConnector extends AbstractConnector {
  constructor(kwargs) {
    super(kwargs)

    this.handleConnect = this.handleConnect.bind(this)
    this.handleNetworkChanged = this.handleNetworkChanged.bind(this)
    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleConnect() {
    // if (__DEV__) {
    console.log("Logging 'connect' event")
    // }
  }

  handleNetworkChanged(networkId) {
    // if (__DEV__) {
    console.log("Handling 'networkChanged' event with payload", networkId)
    // }
    this.emitUpdate({ chainId: networkId })
  }

  handleChainChanged(chainId) {
    // if (__DEV__) {
    console.log("Handling 'chainChanged' event with payload", chainId)
    // }
    this.emitUpdate({ chainId })
  }

  handleAccountsChanged(accounts) {
    // if (__DEV__) {
    console.log("Handling 'accountsChanged' event with payload", accounts)
    // }
    if (accounts.length === 0) {
      this.emitDeactivate()
    } else {
      this.emitUpdate({ account: accounts[0] })
    }
  }

  handleClose(code, reason) {
    // if (__DEV__) {
    console.log("Handling 'close' event with payload", code, reason)
    // }
    this.emitDeactivate()
  }

  async activate() {
    if (!window.ethereum) {
      throw new NoEthereumProviderError()
    }

    window.ethereum.autoRefreshOnNetworkChange = false

    if (window.ethereum.on) {
      window.ethereum.on('connect', this.handleConnect)
      window.ethereum.on('chainChanged', this.handleChainChanged)
      window.ethereum.on('networkChanged', this.handleNetworkChanged)
      window.ethereum.on('accountsChanged', this.handleAccountsChanged)
      window.ethereum.on('close', this.handleClose)
    }

    let account = undefined

    // provides support for most dapp browsers
    if (window.ethereum.isMetaMask) {
      account = await window.ethereum
        .send('eth_requestAccounts')
        .then(({ result: accounts }) => accounts[0])
        .catch(error => {
          if (error && error.code === 4001) {
            throw new UserRejectedRequestError()
          } else {
            throw error
          }
        })
    } else {
      account = await window.ethereum
        .enable()
        .then(accounts => accounts[0])
        .catch(error => {
          if (error && error.code === 4001) {
            throw new UserRejectedRequestError()
          } else {
            throw error
          }
        })
    }

    return { provider: window.ethereum, account }
  }

  async getProvider() {
    return window.ethereum
  }

  async getChainId() {
    if (!window.ethereum) {
      throw new NoEthereumProviderError()
    }
    if (window.ethereum.isMetaMask) {
      return window.ethereum.send('eth_chainId').then(({ result: chainId }) => chainId)
    } else {
      return window.ethereum.networkVersion ? window.ethereum.networkVersion : 1
    }
  }

  async getAccount() {
    if (!window.ethereum) {
      throw new NoEthereumProviderError()
    }
    if (window.ethereum.isMetaMask) {
      return window.ethereum.send('eth_accounts').then(({ result: accounts }) => accounts[0])
    } else {
      return window.ethereum.enable().then(accounts => accounts[0])
    }
  }

  deactivate() {
    if (window.ethereum.removeListener) {
      window.ethereum.removeListener('connect', this.handleConnect)
      window.ethereum.removeListener('chainChanged', this.handleChainChanged)
      window.ethereum.removeListener('networkChanged', this.handleNetworkChanged)
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged)
      window.ethereum.removeListener('close', this.handleClose)
    }
  }

  async isAuthorized() {
    if (window.ethereum) {
      if (!window.ethereum.isMetaMask) {
        return window.ethereum
          .enable()
          .then(accounts => {
            if (accounts.length > 0) {
              return true
            }
            return false
          })
          .catch(() => {
            return false
          })
      } else {
        return window.ethereum
          .send('eth_accounts')
          .then(({ result: accounts }) => {
            if (accounts.length > 0) {
              return true
            }
            return false
          })
          .catch(() => {
            return false
          })
      }
    }
    return false
  }
}
