import { RefObject, useEffect, useRef } from 'react'

export function useOnClickOutside<T extends HTMLElement>(
  node: RefObject<T | undefined>,
  handler: undefined | (() => void),
  ignoredNodes: Array<RefObject<T | undefined>> = []
) {
  const handlerRef = useRef<undefined | (() => void)>(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const nodeClicked = node.current?.contains(e.target as Node)
      const ignoredNodeClicked = ignoredNodes.reduce(
        (reducer, val) => reducer || !!val.current?.contains(e.target as Node),
        false
      )

      if ((nodeClicked || ignoredNodeClicked) ?? false) {
        return
      }

      if (handlerRef.current) handlerRef.current()
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [node, ignoredNodes])
}
