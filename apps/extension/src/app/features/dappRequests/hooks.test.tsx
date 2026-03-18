import { useIsDappRequestConfirming } from 'src/app/features/dappRequests/hooks'
import { DappRequestStatus } from 'src/app/features/dappRequests/shared'
import { ExtensionState } from 'src/store/extensionReducer'
import { renderHook, waitFor } from 'src/test/test-utils'

const MOCK_ID = 'mock-id'

describe('useIsDappRequestConfirming', () => {
  it.each([
    ['returns false when request is not confirming', MOCK_ID, DappRequestStatus.Pending, false],
    ['returns true when request is confirming', MOCK_ID, DappRequestStatus.Confirming, true],
    ['returns false when request does not exist', 'non-existent-id', DappRequestStatus.Confirming, false],
    // eslint-disable-next-line max-params
  ])('%s', async (_, requestId, status, expected) => {
    const preloadedState = {
      dappRequests: {
        requests: {
          [MOCK_ID]: { status, createdAt: Date.now() },
        },
      },
    } as unknown as Partial<ExtensionState>

    const { result } = renderHook(() => useIsDappRequestConfirming(requestId), {
      preloadedState,
    })

    await waitFor(() => expect(result.current).toBe(expected))
  })
})
