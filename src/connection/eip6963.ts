import {
  Actions,
  AddEthereumChainParameter,
  Connector,
  Provider,
  ProviderConnectInfo,
  ProviderRpcError,
} from '@web3-react/types'
import { useSyncExternalStore } from 'react'
import { shallowEqual } from 'react-redux'

import { getPersistedConnectionMeta } from './meta'

function isDataURI(uri: string): boolean {
  return /data:(image\/[-+\w.]+)(;?\w+=[-\w]+)*(;base64)?,.*/gu.test(uri)
}

export interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: Provider
}

interface EIP6963AnnounceProviderEvent extends Event {
  detail: EIP6963ProviderDetail
}

class EIP6963Provider implements Provider {
  private _providerMap: Map<string, EIP6963ProviderDetail>
  currentProvider?: EIP6963ProviderDetail
  proxyListeners: { [eventName: string]: (() => void)[] } = {}

  constructor(_providerMap: Map<string, EIP6963ProviderDetail>) {
    this._providerMap = _providerMap
  }

  async request(args: any): Promise<unknown> {
    return this.currentProvider?.provider.request(args)
  }

  on(eventName: string, listener: (...args: any[]) => void): this {
    if (!this.proxyListeners[eventName]) {
      this.proxyListeners[eventName] = []
    }
    this.proxyListeners[eventName].push(listener)
    this.currentProvider?.provider.on(eventName, listener)
    return this
  }

  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
    this.currentProvider?.provider.removeListener(eventName, listener)
    return this
  }

  setCurrentProvider(rdns: string) {
    const oldProvider = this.currentProvider
    const newProvider = (this.currentProvider = this._providerMap.get(rdns))

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
  private static _providerMap: Map<string, EIP6963ProviderDetail> = new Map()
  private static providerMapListeners = new Set<() => void>()
  public static injectorsPresent = false

  private static subscribeToProviderUpdates(listener: () => void) {
    EIP6963.providerMapListeners.add(listener)

    return () => EIP6963.providerMapListeners.delete(listener)
  }

  public static useInjectedOptions(): ReadonlyMap<string, EIP6963ProviderDetail> {
    // eslint incorrectly thinks this hook is inside of a react class component
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(this.subscribeToProviderUpdates, () => this._providerMap)
  }

  private static onAnnounceProvider(event: EIP6963AnnounceProviderEvent) {
    const { rdns, icon, name, uuid } = event.detail?.info ?? {}

    // ignore improperly formatted eip6963 providers
    if (!rdns || !icon || !name || !uuid || rdns === 'com.coinbase.wallet') return

    this.injectorsPresent = true
    // ignored duplicate announcements
    if (shallowEqual(this._providerMap.get(rdns)?.info, event.detail.info)) return

    this._providerMap.set(rdns, event.detail)
    this.providerMapListeners.forEach((listener) => listener())
  }

  public static get providerMap(): ReadonlyMap<string, EIP6963ProviderDetail> {
    return this._providerMap
  }

  /** {@inheritdoc Connector.provider} */
  provider: EIP6963Provider

  constructor({ actions, onError }: EIP6963ConstructorArgs) {
    super(actions, onError)

    this.provider = new EIP6963Provider(EIP6963._providerMap)
    console.log('cartcrom', this.provider)

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

    window.addEventListener('eip6963:announceProvider', EIP6963.onAnnounceProvider.bind(EIP6963) as EventListener)
    window.addEventListener('eip6963:announceProvider', ((event: EIP6963AnnounceProviderEvent) => {
      if (!event.detail) return
      const { rdns } = event.detail.info
      if (rdns === getPersistedConnectionMeta()?.latestEip6963rdns) {
        this.provider.setCurrentProvider(rdns)
      }
    }) as EventListener)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
  }

  /** Switches which injector the connector uses */
  public selectProvider(rdns: string) {
    this.provider.setCurrentProvider(rdns)
  }

  /** Switches which injector the connector uses */
  public getProviderInfo(rdns: string): EIP6963ProviderInfo | undefined {
    return EIP6963._providerMap.get(rdns)?.info
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
