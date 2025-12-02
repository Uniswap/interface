import type { StorageDriver } from 'uniswap/src/dialog-preferences'
import { createDialogPreferencesService } from 'uniswap/src/dialog-preferences'
import { DialogVisibilityId } from 'uniswap/src/dialog-preferences/types'
import { logger } from 'utilities/src/logger/logger'

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('createDialogPreferencesService', () => {
  let mockStorage: jest.Mocked<StorageDriver>

  beforeEach(() => {
    mockStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    }
    jest.clearAllMocks()
  })

  describe('shouldShowDialog', () => {
    it('returns true when dialog has not been hidden', async () => {
      mockStorage.get.mockResolvedValue(null)
      const service = createDialogPreferencesService({ storage: mockStorage })

      const result = await service.shouldShowDialog(DialogVisibilityId.StorybookExample)

      expect(result).toBe(true)
      expect(mockStorage.get).toHaveBeenCalledWith('uniswap-dialog_hidden_storybook-example')
    })

    it('returns false when dialog has been hidden', async () => {
      mockStorage.get.mockResolvedValue(JSON.stringify({ hidden: true }))
      const service = createDialogPreferencesService({ storage: mockStorage })

      const result = await service.shouldShowDialog(DialogVisibilityId.StorybookExample)

      expect(result).toBe(false)
      expect(mockStorage.get).toHaveBeenCalledWith('uniswap-dialog_hidden_storybook-example')
    })

    it('returns true when storage get fails (graceful degradation)', async () => {
      const error = new Error('Storage unavailable')
      mockStorage.get.mockRejectedValue(error)
      const service = createDialogPreferencesService({ storage: mockStorage })

      const result = await service.shouldShowDialog(DialogVisibilityId.StorybookExample)

      expect(result).toBe(true)
      expect(logger.error).toHaveBeenCalledWith(error, {
        tags: { file: 'createDialogPreferencesService', function: 'shouldShowDialog' },
        extra: { dialogId: 'storybook-example' },
      })
    })

    it('handles different dialog IDs independently', async () => {
      mockStorage.get.mockImplementation(async (key) => {
        if (key === 'uniswap-dialog_hidden_test-dialog-a') {
          return JSON.stringify({ hidden: true })
        }
        return null
      })
      const service = createDialogPreferencesService({ storage: mockStorage })

      const resultA = await service.shouldShowDialog(DialogVisibilityId.TestDialogA)
      const resultB = await service.shouldShowDialog(DialogVisibilityId.TestDialogB)

      expect(resultA).toBe(false)
      expect(resultB).toBe(true)
    })
  })

  describe('markDialogHidden', () => {
    it('stores the hidden preference', async () => {
      mockStorage.set.mockResolvedValue(undefined)
      const service = createDialogPreferencesService({ storage: mockStorage })

      await service.markDialogHidden(DialogVisibilityId.StorybookExample)

      expect(mockStorage.set).toHaveBeenCalledWith(
        'uniswap-dialog_hidden_storybook-example',
        JSON.stringify({ hidden: true }),
      )
    })

    it('calls onChange callback after marking dialog hidden', async () => {
      mockStorage.set.mockResolvedValue(undefined)
      const mockOnChange = jest.fn().mockResolvedValue(undefined)
      const service = createDialogPreferencesService({ storage: mockStorage, onChange: mockOnChange })
      await service.markDialogHidden(DialogVisibilityId.StorybookExample)
      expect(mockOnChange).toHaveBeenCalledWith('storybook-example')
    })

    it('handles storage failures gracefully', async () => {
      const error = new Error('Storage full')
      mockStorage.set.mockRejectedValue(error)
      const service = createDialogPreferencesService({ storage: mockStorage })

      await expect(service.markDialogHidden(DialogVisibilityId.StorybookExample)).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(error, {
        tags: { file: 'createDialogPreferencesService', function: 'markDialogHidden' },
        extra: { dialogId: 'storybook-example' },
      })
    })
  })

  describe('resetDialog', () => {
    it('removes the hidden preference', async () => {
      mockStorage.remove.mockResolvedValue(undefined)
      const service = createDialogPreferencesService({ storage: mockStorage })

      await service.resetDialog(DialogVisibilityId.StorybookExample)

      expect(mockStorage.remove).toHaveBeenCalledWith('uniswap-dialog_hidden_storybook-example')
    })

    it('calls onChange callback after resetting dialog', async () => {
      mockStorage.remove.mockResolvedValue(undefined)
      const mockOnChange = jest.fn().mockResolvedValue(undefined)
      const service = createDialogPreferencesService({ storage: mockStorage, onChange: mockOnChange })
      await service.resetDialog(DialogVisibilityId.StorybookExample)
      expect(mockOnChange).toHaveBeenCalledWith('storybook-example')
    })

    it('handles storage failures gracefully', async () => {
      const error = new Error('Storage unavailable')
      mockStorage.remove.mockRejectedValue(error)
      const service = createDialogPreferencesService({ storage: mockStorage })

      await expect(service.resetDialog(DialogVisibilityId.StorybookExample)).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(error, {
        tags: { file: 'createDialogPreferencesService', function: 'resetDialog' },
        extra: { dialogId: 'storybook-example' },
      })
    })
  })

  describe('full workflow', () => {
    it('handles show -> hide -> reset -> show cycle', async () => {
      const storage = new Map<string, string>()
      const workingStorage: StorageDriver = {
        get: async (key) => storage.get(key) ?? null,
        set: async (key, value) => {
          storage.set(key, value)
        },
        remove: async (key) => {
          storage.delete(key)
        },
      }

      const service = createDialogPreferencesService({ storage: workingStorage })

      // Initially should show
      expect(await service.shouldShowDialog(DialogVisibilityId.StorybookExample)).toBe(true)

      // Hide the dialog
      await service.markDialogHidden(DialogVisibilityId.StorybookExample)
      expect(await service.shouldShowDialog(DialogVisibilityId.StorybookExample)).toBe(false)

      // Reset the dialog
      await service.resetDialog(DialogVisibilityId.StorybookExample)
      expect(await service.shouldShowDialog(DialogVisibilityId.StorybookExample)).toBe(true)
    })
  })
})
