/**
 * Service for managing dialog visibility preferences (e.g., "don't show again" functionality)
 */
export interface DialogPreferencesService {
  /**
   * Check if a dialog should be shown to the user
   * @param dialogId Unique identifier for the dialog
   * @returns true if dialog should be shown, false if user has hidden it
   */
  shouldShowDialog(dialogId: string): Promise<boolean>

  /**
   * Mark a dialog as hidden (user selected "don't show again")
   * @param dialogId Unique identifier for the dialog
   */
  markDialogHidden(dialogId: string): Promise<void>

  /**
   * Reset a dialog's visibility preference (show it again)
   * @param dialogId Unique identifier for the dialog
   */
  resetDialog(dialogId: string): Promise<void>
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
}
