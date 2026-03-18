import { DappResponseType } from 'uniswap/src/features/dappRequests/types'

export type PendingResponseInfo = {
  type: DappResponseType
  source: MessageEventSource | null
}
