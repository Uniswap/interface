// oxlint-disable eslint-js/no-restricted-syntax -- a keyboard owner: the page-wide listener lives here on purpose
import { useEffect, useRef } from 'react'

/**
 * Escape for a custom overlay (bottom sheet, account drawer, inline popover). Open layers form one
 * stack and Escape closes only the top one. Base UI and Radix overlays keep their own dismissal:
 * they `preventDefault()` the event and this listener yields.
 *
 * The stack exists because of force-mounted Radix sheets: Radix dispatches Escape only to the
 * highest-mounted `DismissableLayer`, and a closed `forceMount` sheet stays registered there, so
 * the last-mounted sheet would swallow Escape for every open one. Layers therefore track OPEN
 * instances only, and the sheet Content marks Radix's own Escape through
 * {@link markRadixEscapePreventedBySheet} so the two never double-fire. The legacy `ui/src` sheet
 * and the mycelium compat sheet share this one stack during the migration.
 *
 * Accepted corner: an open Radix dialog above an open sheet closes together with it on one Escape,
 * since a closed-but-highest force-mounted layer marks every press and `defaultPrevented` cannot
 * tell the two apart. Dialog and sheet modes are picked per breakpoint, so the mix is rare.
 */
const openLayerStack: symbol[] = []

/** The last Escape prevented by sheet chrome. Radix marks the event even for a closed force-mounted
 * layer, so `defaultPrevented` alone cannot separate "inert closed sheet touched it" (still close)
 * from "a real inner layer consumed it" (do not close); comparing against this marker can. */
let lastEscapePreventedBySheetChrome: KeyboardEvent | null = null

export function markRadixEscapePreventedBySheet(event: KeyboardEvent): void {
  event.preventDefault()
  lastEscapePreventedBySheetChrome = event
}

export function useDismissLayer({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }): void {
  const idRef = useRef<symbol | undefined>(undefined)
  if (idRef.current === undefined) {
    idRef.current = Symbol('DismissLayer')
  }
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const id = idRef.current as symbol
    openLayerStack.push(id)
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Safari reports the Escape that cancels IME composition with `isComposing` false and keyCode 229.
      if (event.key !== 'Escape' || event.isComposing || event.keyCode === 229) {
        return
      }
      // Consumed by a real inner layer (context menu, dialog), not by sheet chrome.
      if (event.defaultPrevented && event !== lastEscapePreventedBySheetChrome) {
        return
      }
      if (openLayerStack[openLayerStack.length - 1] !== id) {
        return
      }
      event.preventDefault()
      lastEscapePreventedBySheetChrome = event
      onCloseRef.current?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const index = openLayerStack.indexOf(id)
      if (index !== -1) {
        openLayerStack.splice(index, 1)
      }
    }
  }, [isOpen])
}
