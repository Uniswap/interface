// largely taken from https://github.com/NoahZinsmeister/web3-react/blob/v6/packages/walletconnect-connector/src/index.ts
// Implements a function to change targeted connection chain id. When no account is connected and the user switches
// chains in the network switcher, the WalletConnect targeted chain changes too.

import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { IWalletConnectProviderOptions } from '@walletconnect/types'

export const URI_AVAILABLE = 'URI_AVAILABLE'

export interface WalletConnectConnectorArguments extends IWalletConnectProviderOptions {
  supportedChainIds?: number[]
  targetedChainId: number
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

function getSupportedChains({ supportedChainIds, rpc }: WalletConnectConnectorArguments): number[] | undefined {
  if (supportedChainIds) {
    return supportedChainIds
  }

  return rpc ? Object.keys(rpc).map(k => Number(k)) : undefined
}

export class CustomWalletConnectConnector extends AbstractConnector {
  private readonly config: WalletConnectConnectorArguments

  public walletConnectProvider?: any

  constructor(config: WalletConnectConnectorArguments) {
    super({ supportedChainIds: getSupportedChains(config) })
    if (this.supportedChainIds?.indexOf(config.targetedChainId) === -1)
      throw new Error(`unsupported targeted chain id ${config.targetedChainId}`)

    this.config = config

    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
    this.handleDisconnect = this.handleDisconnect.bind(this)
  }

  private handleChainChanged(chainId: number | string): void {
    this.emitUpdate({ chainId })
  }

  private handleAccountsChanged(accounts: string[]): void {
    this.emitUpdate({ account: accounts[0] })
  }

  private handleDisconnect(): void {
    this.emitDeactivate()
    // we have to do this because of a @walletconnect/web3-provider bug
    if (this.walletConnectProvider) {
      this.walletConnectProvider.stop()
      this.walletConnectProvider.removeListener('chainChanged', this.handleChainChanged)
      this.walletConnectProvider.removeListener('accountsChanged', this.handleAccountsChanged)
      this.walletConnectProvider = undefined
    }

    this.emitDeactivate()
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!this.walletConnectProvider) {
      const WalletConnectProvider = await import('@walletconnect/web3-provider').then(m => m?.default ?? m)
      this.walletConnectProvider = new WalletConnectProvider(this.config)
    }

    // ensure that the uri is going to be available, and emit an event if there's a new uri
    if (!this.walletConnectProvider.wc.connected) {
      await this.walletConnectProvider.wc.createSession({ chainId: this.config.targetedChainId })
      this.emit(URI_AVAILABLE, this.walletConnectProvider.wc.uri)
    }

    const account = await this.walletConnectProvider
      .enable()
      .then((accounts: string[]): string => accounts[0])
      .catch((error: Error): void => {
        // TODO ideally this would be a better check
        if (error.message === 'User closed modal') {
          throw new UserRejectedRequestError()
        }

        throw error
      })

    this.walletConnectProvider.on('disconnect', this.handleDisconnect)
    this.walletConnectProvider.on('chainChanged', this.handleChainChanged)
    this.walletConnectProvider.on('accountsChanged', this.handleAccountsChanged)

    return { provider: this.walletConnectProvider, account }
  }

  public async getProvider(): Promise<any> {
    return this.walletConnectProvider
  }

  public async getChainId(): Promise<number | string> {
    return this.walletConnectProvider.send('eth_chainId')
  }

  public async getAccount(): Promise<null | string> {
    return this.walletConnectProvider.send('eth_accounts').then((accounts: string[]): string => accounts[0])
  }

  public deactivate() {
    if (this.walletConnectProvider) {
      this.walletConnectProvider.stop()
      this.walletConnectProvider.removeListener('disconnect', this.handleDisconnect)
      this.walletConnectProvider.removeListener('chainChanged', this.handleChainChanged)
      this.walletConnectProvider.removeListener('accountsChanged', this.handleAccountsChanged)
    }
  }

  public async close() {
    await this.walletConnectProvider?.close()
  }

  public set targetedChainId(newTargetedChainId: number) {
    if (this.supportedChainIds?.indexOf(newTargetedChainId) === -1)
      throw new Error(`unsupported targeted chain id ${newTargetedChainId}`)
    this.config.targetedChainId = newTargetedChainId
  }

  public get targetedChainId(): number {
    return this.config.targetedChainId
  }
}
