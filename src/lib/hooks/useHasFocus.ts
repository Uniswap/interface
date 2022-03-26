import { useCallback, useEffect, useState } from 'react'

export default function useHasFocus(node: Node | null | undefined): boolean {
  useEffect(() => {
    if (node instanceof HTMLElement) {
      // tabIndex is required to receive blur events from non-button elements.
      node.tabIndex = node.tabIndex || -1
      // Without explicitly omitting outline, Safari will now outline this node when focused.
      node.style.outline = node.style.outline || 'none'
    }
  }, [node])
  const [hasFocus, setHasFocus] = useState(node?.contains(document?.activeElement) ?? false)
  const onFocus = useCallback(() => setHasFocus(true), [])
  const onBlur = useCallback((e) => setHasFocus(node?.contains(e.relatedTarget) ?? false), [node])
  useEffect(() => {
    node?.addEventListener('focusin', onFocus)
    node?.addEventListener('focusout', onBlur)
    return () => {
      node?.removeEventListener('focusin', onFocus)
      node?.removeEventListener('focusout', onBlur)
    }
  }, [node, onFocus, onBlur])
  return hasFocus
}
