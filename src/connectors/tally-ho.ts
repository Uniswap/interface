import type { Actions, Provider, ProviderConnectInfo, ProviderRpcError } from '@web3-react/types'
import { Connector } from '@web3-react/types'

export interface TallyHoProvider extends Provider {
  isTally: boolean
  on: (eventName: string, listener: (...args: any[]) => void) => unknown
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
  provider: TallyHoProvider | undefined

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
  }
}
