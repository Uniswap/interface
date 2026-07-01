import { HexString } from '@universe/encoding'
import { CONNECTION_PROVIDER_IDS, CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import {
  ProviderConnectInfo,
  ResourceUnavailableRpcError,
  RpcError,
  SwitchChainError,
  UserRejectedRequestError,
} from 'viem'
import { ChainNotConfiguredError, createConnector } from 'wagmi'
import { getAddress } from '~/chains'
import { EmbeddedWalletProvider, Listener } from '~/connection/EmbeddedWalletProvider'
import { embeddedWalletProvider } from '~/connection/embeddedWalletProviderInstance'
import { getEmbeddedWalletState } from '~/state/embeddedWallet/store'

interface EmbeddedWalletParameters {
  onConnect?(): void
}

export function embeddedWallet(_parameters: EmbeddedWalletParameters = {}) {
  type Provider = EmbeddedWalletProvider
  type Properties = {
    onConnect(connectInfo: ProviderConnectInfo): void
  }
  type StorageItem = { 'embeddedUniswapWallet.disconnected': true }

  return createConnector<Provider, Properties, StorageItem>((config) => {
    // Stable bound references so removeListener receives the same function that was
    // passed to on(). Using .bind(this) inline creates a new reference each call,
    // which means removeListener never actually removes the handler — a classic leak.
    let boundOnConnect: Listener
    let boundOnAccountsChanged: Listener
    let boundOnDisconnect: Listener

    return {
      id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
      name: CONNECTION_PROVIDER_NAMES.EMBEDDED_WALLET,
      type: 'embeddedUniswapWallet',
      async setup() {
        boundOnConnect = this.onConnect.bind(this) as Listener
        boundOnAccountsChanged = this.onAccountsChanged.bind(this) as Listener
        boundOnDisconnect = this.onDisconnect.bind(this) as Listener

        const provider = await this.getProvider()
        provider.on('connect', boundOnConnect)
      },
      async getProvider() {
        return embeddedWalletProvider
      },
      async connect({ chainId } = {}) {
        const { walletAddress, isConnected } = getEmbeddedWalletState()
        if (!walletAddress) {
          throw new ResourceUnavailableRpcError(new Error('No accounts available'))
        }

        if (!isConnected) {
          throw new ResourceUnavailableRpcError(
            new Error(
              'Embedded wallet isConnected state must be updated to true before attempting connection. See useSignInWithPasskey hook.',
            ),
          )
        }

        const provider = await this.getProvider()

        let accounts: readonly HexString[] = []

        accounts = await this.getAccounts().catch(() => [])

        try {
          provider.removeListener('connect', boundOnConnect)
          provider.on('accountsChanged', boundOnAccountsChanged)
          provider.on('chainChanged', this.onChainChanged as Listener)
          provider.on('disconnect', boundOnDisconnect)

          // Switch to chain if provided
          let currentChainId = (await this.getChainId()) as number
          if (chainId && currentChainId !== chainId) {
            const chain = await this.switchChain!({ chainId }).catch((error) => {
              if (error.code === UserRejectedRequestError.code) {
                throw error
              }
              return { id: currentChainId }
            })
            currentChainId = chain.id
          }

          await config.storage?.removeItem('embeddedUniswapWallet.disconnected')

          if (accounts.length === 0) {
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

        provider.removeListener('accountsChanged', boundOnAccountsChanged)
        provider.removeListener('chainChanged', this.onChainChanged)
        provider.removeListener('disconnect', boundOnDisconnect)
        provider.on('connect', boundOnConnect)

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
        const chainId = provider.getChainId()
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
          // oxlint-disable-next-line unicorn/no-single-promise-in-promise-methods
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
        if (accounts.length === 0) {
          this.onDisconnect()
        } else if (config.emitter.listenerCount('connect')) {
          const chainId = (await this.getChainId()).toString()
          this.onConnect({ chainId })
          await config.storage?.removeItem('embeddedUniswapWallet.disconnected')
        } else {
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
        provider.removeListener('connect', boundOnConnect)
        provider.on('accountsChanged', boundOnAccountsChanged)
        provider.on('chainChanged', this.onChainChanged as Listener)
        provider.on('disconnect', boundOnDisconnect)
      },
      async onDisconnect() {
        const provider = await this.getProvider()

        config.emitter.emit('disconnect')

        provider.removeListener('accountsChanged', boundOnAccountsChanged)
        provider.removeListener('chainChanged', this.onChainChanged)
        provider.removeListener('disconnect', boundOnDisconnect)
        provider.on('connect', boundOnConnect)
      },
    }
  })
}
