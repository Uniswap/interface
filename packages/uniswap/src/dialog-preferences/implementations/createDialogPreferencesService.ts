import type {
  DialogPreferencesService,
  DialogPreferencesServiceContext,
} from 'uniswap/src/dialog-preferences/DialogPreferencesService'
import { logger } from 'utilities/src/logger/logger'

const STORAGE_KEY_PREFIX = 'dialog_hidden_'
const getStorageKey = (dialogId: string): string => `uniswap-${STORAGE_KEY_PREFIX}${dialogId}`

/**
 * Creates a dialog preferences service that manages "don't show again" preferences
 * @param ctx Context containing storage driver dependency
 * @returns DialogPreferencesService instance
 */
export function createDialogPreferencesService(ctx: DialogPreferencesServiceContext): DialogPreferencesService {
  const { storage } = ctx

  return {
    async shouldShowDialog(dialogId: string): Promise<boolean> {
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

    async markDialogHidden(dialogId: string): Promise<void> {
      try {
        const key = getStorageKey(dialogId)
        await storage.set(key, JSON.stringify({ hidden: true }))
      } catch (error) {
        // Silent failure - user's preference won't be saved but doesn't break UX
        logger.error(error, {
          tags: { file: 'createDialogPreferencesService', function: 'markDialogHidden' },
          extra: { dialogId },
        })
      }
    },

    async resetDialog(dialogId: string): Promise<void> {
      try {
        const key = getStorageKey(dialogId)
        await storage.remove(key)
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
