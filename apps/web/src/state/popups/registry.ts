import { toast } from 'sonner'
import type { PopupContent } from '~/state/popups/types'

// oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
type PopupListener = (content: PopupContent, key: string, removeAfterMs?: number) => string | number

class PopupRegistry {
  private listener: PopupListener | undefined
  private popupKeyToId = new Map<string, string | number>()
  private removalListeners = new Map<string, Set<() => void>>()

  // oxlint-disable-next-line max-params
  addPopup(content: PopupContent, key: string, removeAfterMs?: number): void {
    if (this.popupKeyToId.has(key)) {
      return
    }
    const toastId = this.listener?.(content, key, removeAfterMs)
    if (toastId) {
      this.popupKeyToId.set(key, toastId)
    }
  }

  addListener(listener: PopupListener): () => void {
    this.listener = listener
    return () => (this.listener = undefined)
  }

  hasPopup(key: string): boolean {
    return this.popupKeyToId.has(key)
  }

  /**
   * Registers a one-shot callback fired when the popup with the given key is removed
   * (user dismissal or auto-close). Returns an unsubscribe function.
   */
  onPopupRemoved(key: string, callback: () => void): () => void {
    const listeners = this.removalListeners.get(key) ?? new Set()
    listeners.add(callback)
    this.removalListeners.set(key, listeners)
    return () => {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.removalListeners.delete(key)
      }
    }
  }

  removePopup(key: string): void {
    toast.dismiss(this.popupKeyToId.get(key))
    this.popupKeyToId.delete(key)

    const listeners = this.removalListeners.get(key)
    if (listeners) {
      this.removalListeners.delete(key)
      listeners.forEach((callback) => callback())
    }
  }
}

export const popupRegistry = new PopupRegistry()
