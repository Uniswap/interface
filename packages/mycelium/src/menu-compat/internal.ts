/**
 * Internal runtime helpers for the menu compat: a stable-callback hook (the
 * `useEvent` the legacy implementation uses, minus the utilities-package
 * dependency) and a verbatim port of the `useOnClickOutside` dismiss hook
 * from `utilities/src/react/hooks.ts` — capture-phase capable, configurable
 * mouse event, ignored-nodes aware.
 */
import * as React from 'react'

/** Stable identity callback that always sees the latest props/state (useEvent semantics). */
export function useStableCallback<A extends unknown[], R>(callback: (...args: A) => R): (...args: A) => R {
  const ref = React.useRef(callback)
  ref.current = callback
  return React.useCallback((...args: A): R => ref.current(...args), [])
}

/**
 * Verbatim-semantics port of the legacy `useOnClickOutside`: fires `handler`
 * when the configured mouse event lands outside `node` and every
 * `ignoredNodes` entry. `capture: true` runs before inner elements that
 * stopPropagation (e.g. modal overlays) — the in-modal dismiss fix.
 */
export function useOnClickOutsideCompat({
  node,
  handler,
  ignoredNodes = [],
  event = 'mousedown',
  capture = false,
}: {
  node: React.RefObject<HTMLElement | undefined | null>
  handler?: () => void
  ignoredNodes?: Array<React.RefObject<HTMLElement | undefined | null>>
  event?: 'mousedown' | 'mouseup'
  capture?: boolean
}): void {
  const handlerRef = React.useRef<undefined | (() => void)>(handler)

  React.useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const nodeClicked = node.current?.contains(e.target as Node)
      const ignoredNodeClicked = ignoredNodes.some((ignored) => ignored.current?.contains(e.target as Node) === true)
      if (nodeClicked === true || ignoredNodeClicked) {
        return
      }
      handlerRef.current?.()
    }

    document.addEventListener(event, handleClickOutside, capture)
    return () => {
      document.removeEventListener(event, handleClickOutside, capture)
    }
  }, [node, event, capture, ignoredNodes])
}

/**
 * Blocks page scrolling outside `node` while `enabled` — the compat stand-in
 * for the legacy `RemoveScroll blockScrollEvents`. Callers apply the legacy
 * `isWebApp` gate through `ContextMenuCompatProps.blockOutsideScroll` (see
 * the exclusions ledger).
 */
export function useBlockOutsideScroll({
  node,
  enabled,
}: {
  node: React.RefObject<HTMLElement | undefined | null>
  enabled: boolean
}): void {
  React.useEffect(() => {
    if (!enabled) {
      return undefined
    }
    const block = (e: Event): void => {
      if (node.current?.contains(e.target as Node) === true) {
        return
      }
      e.preventDefault()
    }
    document.addEventListener('wheel', block, { passive: false, capture: true })
    document.addEventListener('touchmove', block, { passive: false, capture: true })
    return () => {
      document.removeEventListener('wheel', block, { capture: true })
      document.removeEventListener('touchmove', block, { capture: true })
    }
  }, [node, enabled])
}
