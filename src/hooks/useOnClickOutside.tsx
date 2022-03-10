import { RefObject, useEffect, useRef } from 'react'

export function useOnClickOutside<T extends HTMLElement | Array<HTMLElement | null>>(
  node: RefObject<T | undefined>,
  handler: undefined | (() => void)
) {
  const handlerRef = useRef<undefined | (() => void)>(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const nodeList = node.current ? (Array.isArray(node.current) ? node.current : [node.current]) : []
      for (const node of nodeList) {
        if (node?.contains(e.target as Node)) {
          return
        }
      }

      if (handlerRef.current) handlerRef.current()
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [node])
}
