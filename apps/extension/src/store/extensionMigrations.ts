import { DappRequestStatus } from 'src/app/features/dappRequests/shared'
import type { DappRequestState } from 'src/app/features/dappRequests/slice'

export function removeDappInfoToChromeLocalStorage({ dapp: _dapp, ...state }: any): any {
  return state
}

// migrates pending dapp requests array without status or timestamp to a record with status (pending|confirming) and timestamp
export function migratePendingDappRequestsToRecord(state: any): any {
  // If there's no dappRequests state or it's already in the new format, return unchanged
  if (!state.dappRequests || !state.dappRequests.pending || state.dappRequests.requests) {
    return state
  }

  // Create new record object to hold requests
  const requests: DappRequestState['requests'] = {}

  // Convert each pending request to the record format with status
  state.dappRequests.pending.forEach((item: unknown, index: number) => {
    if (
      item !== null &&
      typeof item === 'object' &&
      'dappRequest' in item &&
      typeof item.dappRequest === 'object' &&
      item.dappRequest !== null &&
      'requestId' in item.dappRequest &&
      typeof item.dappRequest.requestId === 'string'
    ) {
      const updatedRequest = {
        ...item,
        // Map to new structure with status and timestamp
        status: DappRequestStatus.Pending,
        createdAt: Date.now() + index * 1000, // Add timestamp for sorting
      } as DappRequestState['requests'][string]

      requests[item.dappRequest.requestId] = updatedRequest
    }
  })

  // Return state with updated dappRequests slice
  return {
    ...state,
    dappRequests: {
      requests,
    },
  }
}
