import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBidConfirmModalState } from '~/components/Toucan/Auction/BidForm/BidReviewModal/useBidConfirmModalState'
import { PreparedBidTransaction } from '~/components/Toucan/Auction/hooks/useBidFormSubmit'
import { PendingModalError } from '~/pages/Swap/Limit/ConfirmSwapModal/Error'
import { ConfirmModalState } from '~/pages/Swap/Limit/ConfirmSwapModal/state'

describe('useBidConfirmModalState', () => {
  it('submits via onSubmit and enters pending state', async () => {
    const preparedBid = {} as PreparedBidTransaction
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useBidConfirmModalState({
        preparedBid,
        onSubmit,
        isOpen: true,
      }),
    )

    await act(async () => {
      await result.current.startBidFlow()
    })

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(preparedBid, {})
    })
    expect(result.current.confirmModalState).toBe(ConfirmModalState.PENDING_CONFIRMATION)
  })

  it('keeps review state when progress modal is skipped', async () => {
    const preparedBid = {} as PreparedBidTransaction
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useBidConfirmModalState({
        preparedBid,
        onSubmit,
        isOpen: true,
      }),
    )

    await act(async () => {
      await result.current.startBidFlow({ showProgressModal: false })
    })

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(preparedBid, {})
    })
    expect(result.current.confirmModalState).toBe(ConfirmModalState.REVIEWING)
  })

  it('handles user rejection without setting error', async () => {
    const preparedBid = {} as PreparedBidTransaction
    const userRejectError = { code: 4001, message: 'User rejected' }
    const onSubmit = vi.fn().mockRejectedValue(userRejectError)

    const { result } = renderHook(() =>
      useBidConfirmModalState({
        preparedBid,
        onSubmit,
        isOpen: true,
      }),
    )

    await act(async () => {
      await result.current.startBidFlow()
    })

    await waitFor(() => {
      expect(result.current.confirmModalState).toBe(ConfirmModalState.REVIEWING)
    })
    expect(result.current.approvalError).toBeUndefined()
  })

  it('sets approval error on non-rejection failures', async () => {
    const preparedBid = {} as PreparedBidTransaction
    const genericError = new Error('Transaction failed')
    const onSubmit = vi.fn().mockRejectedValue(genericError)

    const { result } = renderHook(() =>
      useBidConfirmModalState({
        preparedBid,
        onSubmit,
        isOpen: true,
      }),
    )

    await act(async () => {
      await result.current.startBidFlow()
    })

    await waitFor(() => {
      expect(result.current.confirmModalState).toBe(ConfirmModalState.REVIEWING)
    })
    expect(result.current.approvalError).toBe(PendingModalError.CONFIRMATION_ERROR)
  })

  it('resets state when modal closes (isOpen=false)', async () => {
    const preparedBid = {} as PreparedBidTransaction
    const onSubmit = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useBidConfirmModalState({
          preparedBid,
          onSubmit,
          isOpen,
        }),
      { initialProps: { isOpen: true } },
    )

    // Start the flow to change state
    act(() => {
      result.current.startBidFlow()
    })

    // Wait for state to change to pending
    await waitFor(() => {
      expect(result.current.confirmModalState).toBe(ConfirmModalState.PENDING_CONFIRMATION)
    })

    // Close the modal
    rerender({ isOpen: false })

    await waitFor(() => {
      expect(result.current.confirmModalState).toBe(ConfirmModalState.REVIEWING)
    })
    expect(result.current.approvalError).toBeUndefined()
    expect(result.current.isSubmitting).toBe(false)
  })

  it('onCancel resets all state', async () => {
    const preparedBid = {} as PreparedBidTransaction
    const genericError = new Error('Transaction failed')
    const onSubmit = vi.fn().mockRejectedValue(genericError)

    const { result } = renderHook(() =>
      useBidConfirmModalState({
        preparedBid,
        onSubmit,
        isOpen: true,
      }),
    )

    // Trigger an error to set approvalError
    await act(async () => {
      await result.current.startBidFlow()
    })

    await waitFor(() => {
      expect(result.current.approvalError).toBe(PendingModalError.CONFIRMATION_ERROR)
    })

    // Call onCancel
    act(() => {
      result.current.onCancel()
    })

    expect(result.current.confirmModalState).toBe(ConfirmModalState.REVIEWING)
    expect(result.current.approvalError).toBeUndefined()
    expect(result.current.isSubmitting).toBe(false)
  })

  it('resetToReviewScreen only resets confirmModalState', async () => {
    const preparedBid = {} as PreparedBidTransaction
    const genericError = new Error('Transaction failed')
    const onSubmit = vi.fn().mockRejectedValue(genericError)

    const { result } = renderHook(() =>
      useBidConfirmModalState({
        preparedBid,
        onSubmit,
        isOpen: true,
      }),
    )

    // Trigger an error to set approvalError
    await act(async () => {
      await result.current.startBidFlow()
    })

    await waitFor(() => {
      expect(result.current.approvalError).toBe(PendingModalError.CONFIRMATION_ERROR)
    })

    // Call resetToReviewScreen - should only reset confirmModalState
    act(() => {
      result.current.resetToReviewScreen()
    })

    expect(result.current.confirmModalState).toBe(ConfirmModalState.REVIEWING)
    // Note: approvalError is preserved with resetToReviewScreen
    // This is intentional behavior - the error shows even after resetting to review screen
    expect(result.current.approvalError).toBe(PendingModalError.CONFIRMATION_ERROR)
  })
})
