// largely taken from https://github.com/NoahZinsmeister/web3-react/blob/v6/packages/walletlink-connector/src/index.ts
// Updated to always be in sync with network connector's chain id

import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { NetworkDetails } from '../constants'

const CHAIN_ID = 1

interface WalletLinkConnectorArguments {
  url: string
  appName: string
  appLogoUrl?: string
  darkMode?: boolean
  supportedChainIds?: number[]
}

export class CustomWalletLinkConnector extends AbstractConnector {
  private readonly url: string
  private readonly appName: string
  private readonly appLogoUrl?: string
  private readonly darkMode: boolean

  public walletLink: any
  public provider: any

  constructor({ url, appName, appLogoUrl, darkMode, supportedChainIds }: WalletLinkConnectorArguments) {
    super({ supportedChainIds: supportedChainIds })

    this.url = url
    this.appName = appName
    this.appLogoUrl = appLogoUrl
    this.darkMode = darkMode || false

    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
  }

  public async activate(): Promise<ConnectorUpdate> {
    // @ts-ignore
    if (window.ethereum && window.ethereum.isCoinbaseWallet === true) {
      // user is in the dapp browser on Coinbase Wallet
      this.provider = window.ethereum
    } else if (!this.walletLink) {
      const WalletLink = await import('walletlink').then(m => m?.default ?? m)
      this.walletLink = new WalletLink({
        appName: this.appName,
        darkMode: this.darkMode,
        ...(this.appLogoUrl ? { appLogoUrl: this.appLogoUrl } : {})
      })
      this.provider = this.walletLink.makeWeb3Provider(this.url, CHAIN_ID)
    }

    const accounts = await this.provider.request({
      method: 'eth_requestAccounts'
    })
    const account = accounts[0]

    this.provider.on('chainChanged', this.handleChainChanged)
    this.provider.on('accountsChanged', this.handleAccountsChanged)

    return { provider: this.provider, account: account }
  }

  public async getProvider(): Promise<any> {
    return this.provider
  }

  public async getChainId(): Promise<number> {
    return this.provider.chainId
  }

  public async getAccount(): Promise<null | string> {
    const accounts = await this.provider.request({
      method: 'eth_requestAccounts'
    })
    return accounts[0]
  }

  public deactivate() {
    this.provider.removeListener('chainChanged', this.handleChainChanged)
    this.provider.removeListener('accountsChanged', this.handleAccountsChanged)
  }

  public async close() {
    this.provider.close()
    this.emitDeactivate()
  }

  public changeChainId(networkDetails: NetworkDetails, account?: string | undefined) {
    this.provider
      .request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkDetails.chainId }]
      })
      .catch((error: any) => {
        if (error.code !== 4902) {
          console.error('error switching to chain id', networkDetails.chainId, error)
        }
        this.provider
          .request({
            method: 'wallet_addEthereumChain',
            params: [{ ...networkDetails }, account]
          })
          .catch((error: any) => {
            console.error('error adding chain with id', networkDetails.chainId, error)
          })
      })
  }

  private handleChainChanged(chainId: number | string): void {
    this.emitUpdate({ chainId: chainId })
  }

  private handleAccountsChanged(accounts: string[]): void {
    this.emitUpdate({ account: accounts[0] })
  }
}
