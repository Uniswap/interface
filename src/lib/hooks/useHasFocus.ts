import { useCallback, useEffect, useState } from 'react'

export default function useHasFocus(node: Node | null | undefined): boolean {
  const [hasFocus, setHasFocus] = useState(node?.contains(document.activeElement) ?? false)
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
