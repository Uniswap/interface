// @ts-nocheck
import { AbstractConnector } from '@web3-react/abstract-connector'
import { Send, SendOld, SendReturn, SendReturnResult } from '@web3-react/injected-connector/dist/types'
import { AbstractConnectorArguments, ConnectorUpdate } from '@web3-react/types'
import warning from 'tiny-warning'

const __DEV__ = true

function parseSendReturn(sendReturn: SendReturnResult | SendReturn): any {
  return sendReturn.hasOwnProperty('result') ? sendReturn.result : sendReturn
}

export class NoTeleportProviderError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'No ethereum compatible Teleport provider was found on window.teleport.'
  }
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

export class TeleportInjectedConnector extends AbstractConnector {
  constructor(kwargs: AbstractConnectorArguments) {
    super(kwargs)

    this.handleNetworkChanged = this.handleNetworkChanged.bind(this)
    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  private handleChainChanged(chainId: string | number): void {
    if (__DEV__) {
      console.log("Handling 'chainChanged' event with payload", chainId)
    }
    this.emitUpdate({ chainId, provider: window.teleport })
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (__DEV__) {
      console.log("Handling 'accountsChanged' event with payload", accounts)
    }
    if (accounts.length === 0) {
      this.emitDeactivate()
    } else {
      this.emitUpdate({ account: accounts[0] })
    }
  }

  private handleClose(code: number, reason: string): void {
    if (__DEV__) {
      console.log("Handling 'close' event with payload", code, reason)
    }
    this.emitDeactivate()
  }

  private handleNetworkChanged(networkId: string | number): void {
    if (__DEV__) {
      console.log("Handling 'networkChanged' event with payload", networkId)
    }
    this.emitUpdate({ chainId: networkId, provider: window.teleport })
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!window.teleport) {
      throw new NoTeleportProviderError()
    }

    if (window.teleport.on) {
      window.teleport.on('chainChanged', this.handleChainChanged)
      window.teleport.on('accountsChanged', this.handleAccountsChanged)
      window.teleport.on('close', this.handleClose)
      window.teleport.on('networkChanged', this.handleNetworkChanged)
    }

    if ((window.teleport as any).isMetaMask) {
      ;(window.teleport as any).autoRefreshOnNetworkChange = false
    }

    // try to activate + get account via eth_requestAccounts
    let account
    try {
      account = await (window.teleport!.send as Send)('eth_requestAccounts').then(
        (sendReturn) => parseSendReturn(sendReturn)[0]
      )
    } catch (error) {
      if ((error as any).code === 4001) {
        throw new UserRejectedRequestError()
      }
      warning(false, 'eth_requestAccounts was unsuccessful, falling back to enable')
    }

    // if unsuccessful, try enable
    if (!account) {
      // if enable is successful but doesn't return accounts, fall back to getAccount (not happy i have to do this...)
      account = await window.teleport!.enable().then((sendReturn: any) => sendReturn && parseSendReturn(sendReturn)[0])
    }

    return { provider: window.teleport, ...(account ? { account } : {}) }
  }

  public async getProvider(): Promise<any> {
    return window.teleport
  }

  public async getChainId(): Promise<number | string> {
    if (!window.teleport) {
      throw new NoTeleportProviderError()
    }

    let chainId
    try {
      chainId = await (window.teleport.send as Send)('eth_chainId').then(parseSendReturn)
    } catch {
      warning(false, 'eth_chainId was unsuccessful, falling back to net_version')
    }

    if (!chainId) {
      try {
        chainId = await (window.teleport.send as Send)('net_version').then(parseSendReturn)
      } catch {
        warning(false, 'net_version was unsuccessful, falling back to net version v2')
      }
    }

    if (!chainId) {
      try {
        chainId = parseSendReturn((window.teleport.send as SendOld)({ method: 'net_version' }))
      } catch {
        warning(false, 'net_version v2 was unsuccessful, falling back to manual matches and static properties')
      }
    }

    if (!chainId) {
      if ((window.teleport as any).isDapper) {
        chainId = parseSendReturn((window.teleport as any).cachedResults.net_version)
      } else {
        chainId =
          (window.teleport as any).chainId ||
          (window.teleport as any).netVersion ||
          (window.teleport as any).networkVersion ||
          (window.teleport as any)._chainId
      }
    }

    return chainId
  }

  public async getAccount(): Promise<null | string> {
    if (!window.teleport) {
      throw new NoTeleportProviderError()
    }

    let account
    try {
      account = await (window.teleport.send as Send)('eth_accounts').then(
        (sendReturn) => parseSendReturn(sendReturn)[0]
      )
    } catch {
      warning(false, 'eth_accounts was unsuccessful, falling back to enable')
    }

    if (!account) {
      try {
        account = await window.teleport.enable().then((sendReturn: any) => parseSendReturn(sendReturn)[0])
      } catch {
        warning(false, 'enable was unsuccessful, falling back to eth_accounts v2')
      }
    }

    if (!account) {
      account = parseSendReturn((window.teleport.send as SendOld)({ method: 'eth_accounts' }))[0]
    }

    return account
  }

  public deactivate() {
    if (window.teleport && window.teleport.removeListener) {
      window.teleport.removeListener('chainChanged', this.handleChainChanged)
      window.teleport.removeListener('accountsChanged', this.handleAccountsChanged)
      window.teleport.removeListener('close', this.handleClose)
      window.teleport.removeListener('networkChanged', this.handleNetworkChanged)
    }
  }

  public async isAuthorized(): Promise<boolean> {
    if (!window.teleport) {
      return false
    }

    try {
      return await (window.teleport.send as Send)('eth_accounts').then((sendReturn) => {
        if (parseSendReturn(sendReturn).length > 0) {
          return true
        } else {
          return false
        }
      })
    } catch {
      return false
    }
  }
}
