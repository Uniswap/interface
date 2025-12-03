import { RefObject, useEffect, useRef } from 'react'

function nodeContainsClick<T extends HTMLElement>(node: RefObject<T | undefined | null>, e: MouseEvent) {
  if (node.current?.contains(e.target as Node)) {
    return true
  }

  // Also check bounding rectangle to handle portal'd elements not caught by `contains`.
  const rect = node.current?.getBoundingClientRect()
  if (!rect) {
    return false
  }

  const withinX = e.clientX >= rect.left && e.clientX <= rect.right
  const withinY = e.clientY >= rect.top && e.clientY <= rect.bottom

  return withinX && withinY
}

export function useOnClickOutside<T extends HTMLElement>({
  node,
  handler,
  ignoredNodes = [],
}: {
  node: RefObject<T | undefined | null>
  handler?: () => void
  ignoredNodes?: Array<RefObject<HTMLElement | undefined | null>>
}) {
  const handlerRef = useRef<undefined | (() => void)>(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !node.current ||
        nodeContainsClick(node, e) ||
        ignoredNodes.reduce((reducer, val) => reducer || !!val.current?.contains(e.target as Node), false)
      ) {
        return
      }

      handlerRef.current?.()
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [node, ignoredNodes])
}
