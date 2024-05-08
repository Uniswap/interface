import {
  Actions,
  AddEthereumChainParameter,
  Connector,
  Provider,
  ProviderConnectInfo,
  ProviderRpcError,
} from '@web3-react/types'

import { EIP6963_PROVIDER_MANAGER } from './providers'
import { EIP6963ProviderDetail, EIP6963ProviderInfo } from './types'

type Listener = (...args: any[]) => void

class EIP6963Provider implements Provider {
  currentProviderDetail?: EIP6963ProviderDetail

  // Stores stable references to proxy listeners to prevent memory leaks
  private readonly proxyListeners: { [eventName: string | symbol]: Listener[] } = {}

  async request(args: any): Promise<unknown> {
    return this.currentProviderDetail?.provider.request(args)
  }

  on(eventName: string, listener: Listener): this {
    if (!this.proxyListeners[eventName]) {
      this.proxyListeners[eventName] = []
    }
    this.proxyListeners[eventName].push(listener)
    this.currentProviderDetail?.provider.on(eventName, listener)
    return this
  }

  removeListener(eventName: string | symbol, listener: Listener): this {
    this.currentProviderDetail?.provider.removeListener(eventName, listener)

    if (this.proxyListeners[eventName]) {
      const index = this.proxyListeners[eventName]?.indexOf(listener)
      if (index !== -1) {
        // Splicing is used since proxyListeners must be referentially stable
        this.proxyListeners[eventName]?.splice(index, 1)
      }
    }
    return this
  }

  /** Switches which extension's provider is used based on given rdns. */
  setCurrentProvider(rdns: string) {
    const oldProvider = this.currentProviderDetail
    const newProvider = (this.currentProviderDetail = EIP6963_PROVIDER_MANAGER.map.get(rdns))

    for (const eventName in this.proxyListeners) {
      // proxyListener must be referentially stable to prevent memory leaks
      // pull them from proxyListeners to keep them stable
      for (const proxyListener of this.proxyListeners[eventName]) {
        oldProvider?.provider.removeListener(eventName, proxyListener)
        newProvider?.provider.on(eventName, proxyListener)
      }
    }
  }
}

function parseChainId(chainId: string | number) {
  return typeof chainId === 'string' ? Number.parseInt(chainId, 16) : chainId
}

interface EIP6963ConstructorArgs {
  actions: Actions
  onError?: (error: Error) => void
}

export class EIP6963 extends Connector {
  /** {@inheritdoc Connector.provider} */
  provider: EIP6963Provider

  constructor({ actions, onError }: EIP6963ConstructorArgs) {
    super(actions, onError)

    this.provider = new EIP6963Provider()

    this.provider.on('connect', ({ chainId }: ProviderConnectInfo): void => {
      this.actions.update({ chainId: parseChainId(chainId) })
    })

    this.provider.on('disconnect', (error: ProviderRpcError): void => {
      this.actions.resetState()
      this.onError?.(error)
    })

    this.provider.on('chainChanged', (chainId: string): void => {
      this.actions.update({ chainId: parseChainId(chainId) })
    })

    this.provider.on('accountsChanged', (accounts: string[]): void => {
      this.actions.update({ accounts })
    })
  }

  /** Switches which injector the connector uses */
  public selectProvider(rdns: string) {
    this.provider.setCurrentProvider(rdns)
  }

  public getProviderInfo(rdns: string): EIP6963ProviderInfo | undefined {
    return EIP6963_PROVIDER_MANAGER.map.get(rdns)?.info
  }

  /** {@inheritdoc Connector.connectEagerly} */
  public async connectEagerly(): Promise<void> {
    const cancelActivation = this.actions.startActivation()

    try {
      if (!this.provider) return cancelActivation()

      // Wallets may resolve eth_chainId and hang on eth_accounts pending user interaction, which may include changing
      // chains; they should be requested serially, with accounts first, so that the chainId can settle.
      const accounts = (await this.provider.request({ method: 'eth_accounts' })) as string[]
      if (!accounts.length) throw new Error('No accounts returned')
      const chainId = (await this.provider.request({ method: 'eth_chainId' })) as string
      this.actions.update({ chainId: parseChainId(chainId), accounts })
    } catch (error) {
      console.debug('Could not connect eagerly', error)
      // we should be able to use `cancelActivation` here, but on mobile, metamask emits a 'connect'
      // event, meaning that chainId is updated, and cancelActivation doesn't work because an intermediary
      // update has occurred, so we reset state instead
      this.actions.resetState()
    }
  }

  public async activate(desiredChainIdOrChainParameters?: number | AddEthereumChainParameter): Promise<void> {
    try {
      // Wallets may resolve eth_chainId and hang on eth_accounts pending user interaction, which may include changing
      // chains; they should be requested serially, with accounts first, so that the chainId can settle.
      const accounts = (await this.provider.request({ method: 'eth_requestAccounts' })) as string[]
      const chainId = (await this.provider.request({ method: 'eth_chainId' })) as string
      const receivedChainId = parseChainId(chainId)
      const desiredChainId =
        typeof desiredChainIdOrChainParameters === 'number'
          ? desiredChainIdOrChainParameters
          : desiredChainIdOrChainParameters?.chainId

      // if there's no desired chain, or it's equal to the received, update
      if (!desiredChainId || receivedChainId === desiredChainId) {
        return this.actions.update({ chainId: receivedChainId, accounts })
      }
      const desiredChainIdHex = `0x${desiredChainId.toString(16)}`

      // if we're here, we can try to switch networks
      return this.provider
        .request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: desiredChainIdHex }],
        })
        .catch((error: ProviderRpcError) => {
          // https://github.com/MetaMask/metamask-mobile/issues/3312#issuecomment-1065923294
          const errorCode = (error.data as any)?.originalError?.code || error.code

          // 4902 indicates that the chain has not been added to MetaMask and wallet_addEthereumChain needs to be called
          // https://docs.metamask.io/guide/rpc-api.html#wallet-switchethereumchain
          if (errorCode === 4902 && typeof desiredChainIdOrChainParameters !== 'number') {
            if (!this.provider) throw new Error('No provider')
            // if we're here, we can try to add a new network
            return this.provider.request({
              method: 'wallet_addEthereumChain',
              params: [{ ...desiredChainIdOrChainParameters, chainId: desiredChainIdHex }],
            })
          }
          throw error
        })
        .then(() => this.activate(desiredChainId))
    } catch (error) {
      this.onError?.(error)
      throw error
    }
  }
}
