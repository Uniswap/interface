import { act, waitFor } from '@testing-library/react'
import { SharedQueryClient } from '@universe/api'
import { BehaviorType, useDialogVisibility } from 'uniswap/src/components/dialog/hooks/useDialogVisibility'
import { type DialogPreferencesService } from 'uniswap/src/dialog-preferences'
import { DialogVisibilityId } from 'uniswap/src/dialog-preferences/types'
import { renderHook } from 'uniswap/src/test/test-utils'
import { logger } from 'utilities/src/logger/logger'

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('useDialogVisibility', () => {
  let mockService: jest.Mocked<DialogPreferencesService>

  beforeEach(() => {
    mockService = {
      shouldShowDialog: jest.fn(),
      markDialogHidden: jest.fn(),
      resetDialog: jest.fn(),
    }
    jest.clearAllMocks()
    SharedQueryClient.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('without preferences', () => {
    it('returns shouldShow=true immediately when no visibilityId', () => {
      const { result } = renderHook(() => useDialogVisibility({ isOpen: true, behaviorType: BehaviorType.Default }))

      expect(result.current.shouldShow).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('with preferences', () => {
    it('checks visibility on mount', async () => {
      mockService.shouldShowDialog.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useDialogVisibility({
          visibilityId: DialogVisibilityId.StorybookExample,
          dialogPreferencesService: mockService,
          isOpen: true,
          behaviorType: BehaviorType.DontShowAgain,
        }),
      )

      // Initially loading
      expect(result.current.shouldShow).toBe(null)
      expect(result.current.isLoading).toBe(true)

      // After async check
      await waitFor(() => {
        expect(result.current.shouldShow).toBe(true)
      })
      expect(result.current.isLoading).toBe(false)
      expect(mockService.shouldShowDialog).toHaveBeenCalledWith(DialogVisibilityId.StorybookExample)
    })

    it('sets shouldShow=false when dialog was hidden', async () => {
      mockService.shouldShowDialog.mockResolvedValue(false)

      const { result } = renderHook(() =>
        useDialogVisibility({
          visibilityId: DialogVisibilityId.StorybookExample,
          dialogPreferencesService: mockService,
          isOpen: true,
          behaviorType: BehaviorType.DontShowAgain,
        }),
      )

      await waitFor(() => {
        expect(result.current.shouldShow).toBe(false)
      })
    })

    it('re-checks visibility when visibilityId changes', async () => {
      mockService.shouldShowDialog.mockResolvedValue(true)

      const { result, rerender } = renderHook(useDialogVisibility, {
        initialProps: [
          {
            visibilityId: DialogVisibilityId.TestDialogA,
            dialogPreferencesService: mockService,
            isOpen: true,
            behaviorType: BehaviorType.DontShowAgain,
          },
        ],
      })

      await waitFor(() => {
        expect(result.current.shouldShow).toBe(true)
      })
      expect(mockService.shouldShowDialog).toHaveBeenCalledWith(DialogVisibilityId.TestDialogA)

      mockService.shouldShowDialog.mockClear()
      rerender([
        {
          visibilityId: DialogVisibilityId.TestDialogB,
          dialogPreferencesService: mockService,
          isOpen: true,
          behaviorType: BehaviorType.DontShowAgain,
        },
      ])

      await waitFor(() => {
        expect(mockService.shouldShowDialog).toHaveBeenCalledWith(DialogVisibilityId.TestDialogB)
      })
    })
  })

  describe('dontShowAgain state', () => {
    it('initializes dontShowAgain to false', () => {
      const { result } = renderHook(() => useDialogVisibility({ isOpen: true }))

      expect(result.current.dontShowAgain).toBe(false)
    })

    it('updates dontShowAgain when setDontShowAgain is called', () => {
      const { result } = renderHook(() => useDialogVisibility({ isOpen: true }))

      expect(result.current.dontShowAgain).toBe(false)

      act(() => {
        result.current.setDontShowAgain()
      })

      expect(result.current.dontShowAgain).toBe(true)
    })
  })

  describe('handleClose callback', () => {
    it('saves preference when handleClose is called with dontShowAgain checked', async () => {
      mockService.markDialogHidden.mockResolvedValue(undefined)
      mockService.shouldShowDialog.mockResolvedValue(true)

      const { result, rerender } = renderHook(useDialogVisibility, {
        initialProps: [
          {
            visibilityId: DialogVisibilityId.TestDialogA,
            dialogPreferencesService: mockService,
            isOpen: true,
            behaviorType: BehaviorType.DontShowAgain,
          },
        ],
      })

      // Wait for visibility check to complete
      await waitFor(() => {
        expect(result.current.shouldShow).toBe(true)
      })

      // Check the "don't show again" box while dialog is open
      act(() => {
        result.current.setDontShowAgain()
      })

      // Rerender with isOpen=false (simulating dialog close)
      rerender([
        {
          isOpen: false,
          dialogPreferencesService: mockService,
          visibilityId: DialogVisibilityId.TestDialogA,
          behaviorType: BehaviorType.DontShowAgain,
        },
      ])

      await waitFor(() => {
        expect(mockService.markDialogHidden).toHaveBeenCalledWith(DialogVisibilityId.TestDialogA)
      })
    })

    it('does not save preference when handleClose is called without dontShowAgain checked', async () => {
      mockService.markDialogHidden.mockResolvedValue(undefined)
      mockService.shouldShowDialog.mockResolvedValue(true)

      const { result, rerender } = renderHook(useDialogVisibility, {
        initialProps: [
          {
            visibilityId: DialogVisibilityId.StorybookExample,
            dialogPreferencesService: mockService,
            isOpen: true,
            behaviorType: BehaviorType.DontShowAgain,
          },
        ],
      })

      rerender([
        {
          isOpen: false,
          dialogPreferencesService: mockService,
          visibilityId: DialogVisibilityId.StorybookExample,
          behaviorType: BehaviorType.DontShowAgain,
        },
      ])

      // Wait a bit to ensure no call is made
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockService.markDialogHidden).not.toHaveBeenCalled()
    })

    it('logs error if markDialogHidden fails', async () => {
      const testError = new Error('Failed to save preference')
      mockService.markDialogHidden.mockRejectedValue(testError)

      const { result, rerender } = renderHook(useDialogVisibility, {
        initialProps: [
          {
            visibilityId: DialogVisibilityId.StorybookExample,
            dialogPreferencesService: mockService,
            isOpen: true,
            behaviorType: BehaviorType.DontShowAgain,
          },
        ],
      })

      act(() => {
        result.current.setDontShowAgain()
      })

      rerender([
        {
          isOpen: false,
          dialogPreferencesService: mockService,
          visibilityId: DialogVisibilityId.StorybookExample,
          behaviorType: BehaviorType.DontShowAgain,
        },
      ])

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(testError, {
          tags: { file: 'useDialogVisibility', function: 'markDialogHidden' },
          extra: { visibilityId: DialogVisibilityId.StorybookExample },
        })
      })
    })

    it('saves preference for original visibilityId when it changes after checkbox is checked', async () => {
      mockService.markDialogHidden.mockResolvedValue(undefined)
      mockService.shouldShowDialog.mockResolvedValue(true)

      const { result, rerender } = renderHook(useDialogVisibility, {
        initialProps: [
          {
            visibilityId: DialogVisibilityId.TestDialogA,
            dialogPreferencesService: mockService,
            isOpen: true,
            behaviorType: BehaviorType.DontShowAgain,
          },
        ],
      })

      // Wait for visibility check to complete
      await waitFor(() => {
        expect(result.current.shouldShow).toBe(true)
      })

      // Check the "don't show again" box while dialog is open with TestDialogA
      act(() => {
        result.current.setDontShowAgain()
      })

      // Change visibilityId while dialog is still open
      rerender([
        {
          isOpen: true,
          dialogPreferencesService: mockService,
          visibilityId: DialogVisibilityId.TestDialogB,
          behaviorType: BehaviorType.DontShowAgain,
        },
      ])

      // Close the dialog
      rerender([
        {
          isOpen: false,
          dialogPreferencesService: mockService,
          visibilityId: DialogVisibilityId.TestDialogB,
          behaviorType: BehaviorType.DontShowAgain,
        },
      ])

      // Should save preference for TestDialogA (the ID that was active when checkbox was checked)
      await waitFor(() => {
        expect(mockService.markDialogHidden).toHaveBeenCalledWith(DialogVisibilityId.TestDialogA)
      })
      // Should NOT save for TestDialogB
      expect(mockService.markDialogHidden).not.toHaveBeenCalledWith(DialogVisibilityId.TestDialogB)
    })
  })
})
