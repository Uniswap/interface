import { EmbeddedWalletProvider, Listener, embeddedWalletProvider } from 'connection/EmbeddedWalletProvider'
import {
  ProviderConnectInfo,
  ResourceUnavailableRpcError,
  RpcError,
  SwitchChainError,
  UserRejectedRequestError,
  getAddress,
} from 'viem'
import { ChainNotConfiguredError, createConnector } from 'wagmi'

interface EmbeddedWalletParameters {
  onConnect?(): void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function embeddedWallet(parameters: EmbeddedWalletParameters = {}) {
  type Provider = EmbeddedWalletProvider
  type Properties = {
    onConnect(connectInfo: ProviderConnectInfo): void
  }
  type StorageItem = { 'embeddedUniswapWallet.disconnected': true }

  return createConnector<Provider, Properties, StorageItem>((config) => ({
    id: 'embeddedUniswapWalletConnector',
    name: 'Embedded Wallet',
    type: 'embeddedUniswapWallet',
    async setup() {
      const provider = await this.getProvider()
      if (provider) {
        provider.on('connect', this.onConnect.bind(this) as Listener)
      }
    },
    async getProvider() {
      return embeddedWalletProvider
    },
    async connect({ chainId } = {}) {
      // TODO[EW]: move from localstorage to context layer
      if (!localStorage.getItem('embeddedUniswapWallet.address')) {
        throw new ResourceUnavailableRpcError(new Error('No accounts available'))
      }

      const provider = await this.getProvider()

      let accounts: readonly `0x${string}`[] = []

      accounts = await this.getAccounts().catch(() => [])

      try {
        provider.removeListener('connect', this.onConnect.bind(this) as Listener)
        provider.on('accountsChanged', this.onAccountsChanged.bind(this) as Listener)
        provider.on('chainChanged', this.onChainChanged as Listener)
        provider.on('disconnect', this.onDisconnect.bind(this) as Listener)

        // Switch to chain if provided
        let currentChainId = (await this.getChainId()) as number
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId }).catch((error) => {
            if (error.code === UserRejectedRequestError.code) {
              throw error
            }
            return { id: currentChainId }
          })
          currentChainId = chain?.id ?? currentChainId
        }

        await config.storage?.removeItem('embeddedUniswapWallet.disconnected')

        if (!accounts || accounts.length === 0) {
          throw new ResourceUnavailableRpcError(new Error('No accounts available'))
        }

        return { accounts, chainId: currentChainId }
      } catch (err) {
        const error = err as RpcError
        if (error.code === UserRejectedRequestError.code) {
          throw new UserRejectedRequestError(error)
        }
        if (error.code === ResourceUnavailableRpcError.code) {
          throw new ResourceUnavailableRpcError(error)
        }
        throw error
      }
    },
    async disconnect() {
      const provider = await this.getProvider()

      provider.removeListener('accountsChanged', this.onAccountsChanged.bind(this))
      provider.removeListener('chainChanged', this.onChainChanged)
      provider.removeListener('disconnect', this.onDisconnect.bind(this))
      provider.on('connect', this.onConnect.bind(this) as Listener)

      // TODO[EW]: move from localstorage to context layer
      localStorage.removeItem('embeddedUniswapWallet.address')
      config.storage?.setItem('embeddedUniswapWallet.disconnected', true)
    },
    async getAccounts() {
      const provider = await this.getProvider()
      const accounts = (await provider.request({
        method: 'eth_accounts',
      })) as string[]
      return accounts.map((x) => getAddress(x))
    },
    async getChainId() {
      const provider = await this.getProvider()
      const chainId = provider.getChainId() || (await provider?.request({ method: 'eth_chainId' }))
      return Number(chainId)
    },
    async isAuthorized() {
      try {
        const accounts = await this.getAccounts()
        return !!accounts.length
      } catch {
        return false
      }
    },
    async switchChain({ chainId }) {
      const provider = await this.getProvider()

      const chain = config.chains.find((x) => x.id === chainId)
      if (!chain) {
        throw new SwitchChainError(new ChainNotConfiguredError())
      }

      try {
        await Promise.all([
          provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
          }),
        ])
        return chain
      } catch (err) {
        const error = err as RpcError
        if (error.code === UserRejectedRequestError.code) {
          throw new UserRejectedRequestError(error)
        }
        throw new SwitchChainError(error)
      }
    },
    async onAccountsChanged(accounts) {
      // Disconnect if there are no accounts
      if (accounts.length === 0) {
        this.onDisconnect()
      }
      // Connect if emitter is listening for connect event (e.g. is disconnected and connects through wallet interface)
      else if (config.emitter.listenerCount('connect')) {
        const chainId = (await this.getChainId()).toString()
        this.onConnect({ chainId })
        await config.storage?.removeItem('embeddedUniswapWallet.disconnected')
      }
      // Regular change event
      else {
        config.emitter.emit('change', {
          accounts: accounts.map((x) => getAddress(x)),
        })
      }
    },
    onChainChanged(chain) {
      const chainId = Number(chain)
      config.emitter.emit('change', { chainId })
    },
    async onConnect(connectInfo) {
      const accounts = await this.getAccounts()
      if (accounts.length === 0) {
        return
      }

      const chainId = Number(connectInfo.chainId)
      config.emitter.emit('connect', { accounts, chainId })

      const provider = await this.getProvider()
      if (provider) {
        provider.removeListener('connect', this.onConnect.bind(this))
        provider.on('accountsChanged', this.onAccountsChanged.bind(this) as any)
        provider.on('chainChanged', this.onChainChanged as any)
        provider.on('disconnect', this.onDisconnect.bind(this) as any)
      }
    },
    // this can accept an `error` argument if needed.
    async onDisconnect() {
      const provider = await this.getProvider()

      // No need to remove 'metaMaskSDK.disconnected' from storage because `onDisconnect` is typically
      // only called when the wallet is disconnected through the wallet's interface, meaning the wallet
      // actually disconnected and we don't need to simulate it.
      config.emitter.emit('disconnect')

      provider.removeListener('accountsChanged', this.onAccountsChanged.bind(this))
      provider.removeListener('chainChanged', this.onChainChanged)
      provider.removeListener('disconnect', this.onDisconnect.bind(this))
      provider.on('connect', this.onConnect.bind(this) as any)
    },
  }))
}
