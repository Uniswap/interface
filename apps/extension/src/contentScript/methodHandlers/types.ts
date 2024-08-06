import { DappResponseType } from 'src/app/features/dappRequests/types/DappRequestTypes'

export type PendingResponseInfo = {
  type: DappResponseType
  source: MessageEventSource | null
}
