import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useToucanSubmitBid } from '~/features/Toucan/Auction/hooks/useToucanSubmitBid'
import type { SubmitToucanBidParams } from '~/state/sagas/toucan/types'

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  selectChain: vi.fn(),
  disableOneClickSwap: vi.fn(),
  trigger: vi.fn((payload: unknown) => ({ type: 'submitToucanBidSaga/trigger', payload })),
}))

vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }))
vi.mock('~/connection/hooks/useSelectChain', () => ({ useSelectChain: () => mocks.selectChain }))
vi.mock('~/state/oneClickSwap/hooks', () => ({ useSetOverrideOneClickSwapFlag: () => mocks.disableOneClickSwap }))
vi.mock('~/state/sagas/toucan/submitBidSaga', () => ({
  submitToucanBidSaga: { actions: { trigger: mocks.trigger } },
}))

type CallerParams = Omit<SubmitToucanBidParams, 'selectChain' | 'disableOneClickSwap'>

describe('useToucanSubmitBid', () => {
  it('dispatches the bid with the batch flag and the switch that turns batching off after a declined upgrade', async () => {
    const { result } = renderHook(() => useToucanSubmitBid())
    result.current({ chainId: 8453, canBatchTransactions: true } as unknown as CallerParams)

    const payload = mocks.trigger.mock.calls[0]?.[0] as SubmitToucanBidParams
    expect(payload.canBatchTransactions).toBe(true)
    expect(payload.disableOneClickSwap).toBe(mocks.disableOneClickSwap)
    expect(mocks.dispatch).toHaveBeenCalledWith(mocks.trigger.mock.results[0]?.value)

    mocks.selectChain.mockResolvedValueOnce(true)
    await expect(payload.selectChain(8453)).resolves.toBe(true)
    expect(mocks.selectChain).toHaveBeenCalledWith(8453)
  })
})
