import { PopupContent } from 'components/Popups/types'
import { toast } from 'sonner'
type PopupListener = (content: PopupContent, key: string, removeAfterMs?: number) => string | number

class PopupRegistry {
  private listener: PopupListener | undefined
  private popupKeyToId = new Map<string, string | number>()

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

  removePopup(key: string): void {
    this.popupKeyToId.delete(key)
    toast.dismiss(this.popupKeyToId.get(key))
  }
}

export const popupRegistry = new PopupRegistry()
