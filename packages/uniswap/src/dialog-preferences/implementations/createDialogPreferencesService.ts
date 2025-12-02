import type {
  DialogPreferencesService,
  DialogPreferencesServiceContext,
} from 'uniswap/src/dialog-preferences/DialogPreferencesService'
import type { DialogVisibilityId } from 'uniswap/src/dialog-preferences/types'
import { logger } from 'utilities/src/logger/logger'

const STORAGE_KEY_PREFIX = 'uniswap-dialog_hidden_'
const getStorageKey = (dialogId: string): string => `${STORAGE_KEY_PREFIX}${dialogId}`

/**
 * Creates a dialog preferences service that manages "don't show again" preferences
 * @param ctx Context containing storage driver dependency
 * @returns DialogPreferencesService instance
 */
export function createDialogPreferencesService(ctx: DialogPreferencesServiceContext): DialogPreferencesService {
  const { storage, onChange } = ctx

  return {
    async shouldShowDialog(dialogId: DialogVisibilityId): Promise<boolean> {
      try {
        const key = getStorageKey(dialogId)
        const value = await storage.get(key)
        return JSON.parse(value ?? '{}').hidden !== true
      } catch (error) {
        // If storage fails, default to showing the dialog
        logger.error(error, {
          tags: { file: 'createDialogPreferencesService', function: 'shouldShowDialog' },
          extra: { dialogId },
        })
        return true
      }
    },

    async markDialogHidden(dialogId: DialogVisibilityId): Promise<void> {
      try {
        const key = getStorageKey(dialogId)
        await storage.set(key, JSON.stringify({ hidden: true }))
        await onChange?.(dialogId)
      } catch (error) {
        // Silent failure - user's preference won't be saved but doesn't break UX
        logger.error(error, {
          tags: { file: 'createDialogPreferencesService', function: 'markDialogHidden' },
          extra: { dialogId },
        })
      }
    },

    async resetDialog(dialogId: DialogVisibilityId): Promise<void> {
      try {
        const key = getStorageKey(dialogId)
        await storage.remove(key)
        // Notify about preference change
        await onChange?.(dialogId)
      } catch (error) {
        // Silent failure - dialog will remain hidden but doesn't break UX
        logger.error(error, {
          tags: { file: 'createDialogPreferencesService', function: 'resetDialog' },
          extra: { dialogId },
        })
      }
    },
  }
}
