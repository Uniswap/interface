import { type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { GetEarnPositionResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { describe, expect, it, vi } from 'vitest'
import { type DataApiServiceClientV2 } from '../../clients/createDataApiServiceClientV2'
import { getEarnPositionQueryOptions } from './earn'

const getEarnPosition = vi.fn()
const client = { getEarnPosition } as unknown as DataApiServiceClientV2

describe('getEarnPositionQueryOptions', () => {
  it('keeps the observer stable when closing a vault with no position', () => {
    const queryClient = new QueryClient()
    const selectPosition = (
      data: PlainMessage<GetEarnPositionResponse> | undefined,
    ): PlainMessage<GetEarnPositionResponse>['position'] => data?.position
    const options = getEarnPositionQueryOptions(client, {
      params: { walletAddress: '0xwallet', vaultAddress: '0xvault', chainId: 1 },
      select: selectPosition,
    })
    queryClient.setQueryData(options.queryKey, toPlainMessage(new GetEarnPositionResponse()))

    const observer = new QueryObserver(queryClient, options)
    observer.trackProp('isSuccess')
    observer.trackProp('isPlaceholderData')
    const onChange = vi.fn()
    const unsubscribe = observer.subscribe(onChange)
    const closedOptions = getEarnPositionQueryOptions(client, { params: undefined, select: selectPosition })

    try {
      observer.setOptions(closedOptions)
      onChange.mockClear()

      // Model useQuery's render/effect cycle without starting an unbounded React update loop.
      for (let render = 0; render < 3; render++) {
        observer.getOptimisticResult(queryClient.defaultQueryOptions(closedOptions))
        observer.setOptions(closedOptions)
      }

      expect(observer.getCurrentResult()).toMatchObject({ data: undefined, isEnabled: false, fetchStatus: 'idle' })
      expect(onChange).not.toHaveBeenCalled()
      expect(getEarnPosition).not.toHaveBeenCalled()
    } finally {
      unsubscribe()
      queryClient.clear()
    }
  })
})
