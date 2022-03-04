import { useCallback, useEffect, useState } from 'react'

export default function useHasHover(node: Node | null | undefined): boolean {
  const [hasHover, setHasHover] = useState(false)
  const onMouseEnter = useCallback(() => setHasHover(true), [])
  const onMouseLeave = useCallback((e) => setHasHover(false), [])
  useEffect(() => {
    node?.addEventListener('mouseenter', onMouseEnter)
    node?.addEventListener('mouseleave', onMouseLeave)
    return () => {
      node?.removeEventListener('mouseenter', onMouseEnter)
      node?.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [node, onMouseEnter, onMouseLeave])
  return hasHover
}
