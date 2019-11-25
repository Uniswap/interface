import {
  InjectedConnector as InjectedConnectorCore,
  NoEthereumProviderError,
  UserRejectedRequestError
} from '@web3-react/injected-connector'

export class InjectedConnector extends InjectedConnectorCore {
  async activate() {
    if (!window.ethereum) {
      throw new NoEthereumProviderError()
    }

    if (window.ethereum.on) {
      window.ethereum.on('connect', this.handleConnect)
      window.ethereum.on('chainChanged', this.handleChainChanged)
      window.ethereum.on('networkChanged', this.handleNetworkChanged)
      window.ethereum.on('accountsChanged', this.handleAccountsChanged)
      window.ethereum.on('close', this.handleClose)
    }

    // provides support for most dapp browsers
    let account = undefined
    if (window.ethereum.isMetaMask) {
      window.ethereum.autoRefreshOnNetworkChange = false
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
    if (window.ethereum && window.ethereum.removeListener) {
      window.ethereum.removeListener('connect', this.handleConnect)
      window.ethereum.removeListener('chainChanged', this.handleChainChanged)
      window.ethereum.removeListener('networkChanged', this.handleNetworkChanged)
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged)
      window.ethereum.removeListener('close', this.handleClose)
    }
  }

  async isAuthorized() {
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) {
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
      } else {
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
      }
    }
    return false
  }
}
