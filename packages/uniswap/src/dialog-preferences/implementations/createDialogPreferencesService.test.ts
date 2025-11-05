import type { StorageDriver } from 'uniswap/src/dialog-preferences'
import { createDialogPreferencesService } from 'uniswap/src/dialog-preferences'
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

      const result = await service.shouldShowDialog('test-dialog')

      expect(result).toBe(true)
      expect(mockStorage.get).toHaveBeenCalledWith('uniswap-dialog_hidden_test-dialog')
    })

    it('returns false when dialog has been hidden', async () => {
      mockStorage.get.mockResolvedValue(JSON.stringify({ hidden: true }))
      const service = createDialogPreferencesService({ storage: mockStorage })

      const result = await service.shouldShowDialog('test-dialog')

      expect(result).toBe(false)
      expect(mockStorage.get).toHaveBeenCalledWith('uniswap-dialog_hidden_test-dialog')
    })

    it('returns true when storage get fails (graceful degradation)', async () => {
      const error = new Error('Storage unavailable')
      mockStorage.get.mockRejectedValue(error)
      const service = createDialogPreferencesService({ storage: mockStorage })

      const result = await service.shouldShowDialog('test-dialog')

      expect(result).toBe(true)
      expect(logger.error).toHaveBeenCalledWith(error, {
        tags: { file: 'createDialogPreferencesService', function: 'shouldShowDialog' },
        extra: { dialogId: 'test-dialog' },
      })
    })

    it('handles different dialog IDs independently', async () => {
      mockStorage.get.mockImplementation(async (key) => {
        if (key === 'uniswap-dialog_hidden_dialog-a') {
          return JSON.stringify({ hidden: true })
        }
        return null
      })
      const service = createDialogPreferencesService({ storage: mockStorage })

      const resultA = await service.shouldShowDialog('dialog-a')
      const resultB = await service.shouldShowDialog('dialog-b')

      expect(resultA).toBe(false)
      expect(resultB).toBe(true)
    })
  })

  describe('markDialogHidden', () => {
    it('stores the hidden preference', async () => {
      mockStorage.set.mockResolvedValue(undefined)
      const service = createDialogPreferencesService({ storage: mockStorage })

      await service.markDialogHidden('test-dialog')

      expect(mockStorage.set).toHaveBeenCalledWith(
        'uniswap-dialog_hidden_test-dialog',
        JSON.stringify({ hidden: true }),
      )
    })

    it('handles storage failures gracefully', async () => {
      const error = new Error('Storage full')
      mockStorage.set.mockRejectedValue(error)
      const service = createDialogPreferencesService({ storage: mockStorage })

      await expect(service.markDialogHidden('test-dialog')).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(error, {
        tags: { file: 'createDialogPreferencesService', function: 'markDialogHidden' },
        extra: { dialogId: 'test-dialog' },
      })
    })
  })

  describe('resetDialog', () => {
    it('removes the hidden preference', async () => {
      mockStorage.remove.mockResolvedValue(undefined)
      const service = createDialogPreferencesService({ storage: mockStorage })

      await service.resetDialog('test-dialog')

      expect(mockStorage.remove).toHaveBeenCalledWith('uniswap-dialog_hidden_test-dialog')
    })

    it('handles storage failures gracefully', async () => {
      const error = new Error('Storage unavailable')
      mockStorage.remove.mockRejectedValue(error)
      const service = createDialogPreferencesService({ storage: mockStorage })

      await expect(service.resetDialog('test-dialog')).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(error, {
        tags: { file: 'createDialogPreferencesService', function: 'resetDialog' },
        extra: { dialogId: 'test-dialog' },
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
      expect(await service.shouldShowDialog('workflow-test')).toBe(true)

      // Hide the dialog
      await service.markDialogHidden('workflow-test')
      expect(await service.shouldShowDialog('workflow-test')).toBe(false)

      // Reset the dialog
      await service.resetDialog('workflow-test')
      expect(await service.shouldShowDialog('workflow-test')).toBe(true)
    })
  })
})
