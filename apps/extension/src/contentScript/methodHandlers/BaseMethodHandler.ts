import { JsonRpcProvider } from '@ethersproject/providers'
import { WindowEthereumRequest } from 'src/contentScript/types'

export abstract class BaseMethodHandler<T extends WindowEthereumRequest> {
  constructor(
    protected readonly getChainId: () => string | undefined,
    protected readonly getProvider: () => JsonRpcProvider | undefined,
    protected readonly getConnectedAddresses: () => Address[] | undefined,
    protected readonly setChainIdAndMaybeEmit: (newChainId: string) => void,
    protected readonly setProvider: (newProvider: JsonRpcProvider) => void,
    protected readonly setConnectedAddressesAndMaybeEmit: (newConnectedAddresses: Address[]) => void,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(request: T, source: MessageEventSource | null): void {}
}
