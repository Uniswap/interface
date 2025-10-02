import { PopupItem } from 'components/Popups/PopupItem'
import { popupRegistry } from 'components/Popups/registry'
import { PopupContent } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { spacing } from 'ui/src/theme'

export function PopupRenderer() {
  useEffect(() => {
    // eslint-disable-next-line max-params
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
      style={{
        marginTop: spacing.spacing32,
      }}
      toastOptions={{
        style: {
          padding: 0,
          margin: 0,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          display: 'flex',
          justifyContent: 'flex-end',
        },
      }}
    />
  )
}
