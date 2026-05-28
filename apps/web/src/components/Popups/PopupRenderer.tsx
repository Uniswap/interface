import { PopupItem } from 'components/Popups/PopupItem'
import { popupRegistry } from 'components/Popups/registry'
import { PopupContent } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { useEffect } from 'react'
import { Toaster, toast } from 'sonner'

export function PopupRenderer() {
  useEffect(() => {
    const unsubscribe = popupRegistry.addListener((content: PopupContent, key: string, removeAfterMs?: number) => {
      const toastId = toast(
        <PopupItem key={key} content={content} onClose={() => popupRegistry.removePopup(key)} popKey={key} />,
        {
          duration: removeAfterMs ?? DEFAULT_TXN_DISMISS_MS,
          onDismiss: () => {
            popupRegistry.removePopup(key)
          },
          onAutoClose: () => {
            popupRegistry.removePopup(key)
          },
        },
      )
      return toastId
    })

    return unsubscribe
  }, [])

  return (
    <Toaster
      position="top-right"
      pauseWhenPageIsHidden
      expand
      gap={16}
      toastOptions={{
        style: {
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        },
      }}
    />
  )
}
