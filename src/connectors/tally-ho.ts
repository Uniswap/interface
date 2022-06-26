import type { Actions, Provider, ProviderConnectInfo, ProviderRpcError } from '@web3-react/types'
import { Connector } from '@web3-react/types'

export interface TallyHoProvider extends Provider {
  isTally: boolean
}

function isTally(provider: unknown): provider is TallyHoProvider {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'request' in provider &&
    'isTally' in provider &&
    (provider as TallyHoProvider).isTally
  )
}

function parseChainId(chainId: string | number) {
  return typeof chainId === 'string' ? Number.parseInt(chainId, 16) : chainId
}

export interface TallyHoConstructorArgs {
  actions: Actions
  onError?: (error: Error) => void
}

export class TallyHo extends Connector {
  provider: Provider | undefined

  constructor({ actions, onError }: TallyHoConstructorArgs) {
    super(actions, onError)
  }

  public async connectEagerly(): Promise<void> {
    this.activate()
  }

  public async activate(): Promise<void> {
    if (window === undefined) {
      throw new Error(
        "window is not defined. This should not have happened. 'Toto, I have a feeling we're not in Kansas anymore! 🌪'"
      )
    }

    if (!this.provider) {
      this.initializeProvider()
    }

    if (isTally(this.provider)) {
      const cancelActivation = this.actions.startActivation()

      try {
        const accounts = (await this.provider.request({ method: 'eth_requestAccounts' })) as string[]
        const chainId = (await this.provider.request({ method: 'eth_chainId' })) as string

        this.actions.update({
          chainId: parseChainId(chainId),
          accounts,
        })
      } catch (error) {
        cancelActivation()
        throw error
      }
    }
  }

  private initializeProvider() {
    if (isTally(window.tally)) {
      this.provider = window.tally

      // FIXME on is not recognized on Provider, but EventEmitter is extended in the type
      // @ts-ignore
      this.provider.on('connect', ({ chainId }: ProviderConnectInfo): void => {
        this.actions.update({ chainId: parseChainId(chainId) })
      })

      // FIXME on is not recognized on Provider, but EventEmitter is extended in the type
      // @ts-ignore
      this.provider.on('disconnect', (error: ProviderRpcError): void => {
        this.actions.resetState()
        this.onError?.(error)
      })

      // FIXME on is not recognized on Provider, but EventEmitter is extended in the type
      // @ts-ignore
      this.provider.on('chainChanged', (chainId: string): void => {
        this.actions.update({ chainId: parseChainId(chainId) })
      })

      // FIXME on is not recognized on Provider, but EventEmitter is extended in the type
      // @ts-ignore
      this.provider.on('accountsChanged', (accounts: string[]): void => {
        this.actions.update({ accounts })
      })
    }
  }
}
