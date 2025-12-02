import { DialogVisibilityId } from 'uniswap/src/dialog-preferences/types'

/**
 * Service for managing dialog visibility preferences (e.g., "don't show again" functionality)
 */
export interface DialogPreferencesService {
  /**
   * Check if a dialog should be shown to the user
   * @param dialogId Unique identifier for the dialog
   * @returns true if dialog should be shown, false if user has hidden it
   */
  shouldShowDialog(dialogId: DialogVisibilityId): Promise<boolean>

  /**
   * Mark a dialog as hidden (user selected "don't show again")
   * @param dialogId Unique identifier for the dialog
   */
  markDialogHidden(dialogId: DialogVisibilityId): Promise<void>

  /**
   * Reset a dialog's visibility preference (show it again)
   * @param dialogId Unique identifier for the dialog
   */
  resetDialog(dialogId: DialogVisibilityId): Promise<void>
}

/**
 * Storage driver interface for persisting dialog preferences
 * TODO: remove this when the packages/utilities implementation is merged (PR #23685)
 */
export interface StorageDriver {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

/**
 * Context/dependencies for creating a DialogPreferencesService
 */
export interface DialogPreferencesServiceContext {
  storage: StorageDriver
  /**
   * Optional callback invoked after dialog preferences are changed
   * @param dialogId The ID of the dialog that was modified
   */
  onChange?: (dialogId: DialogVisibilityId) => void | Promise<void>
}
