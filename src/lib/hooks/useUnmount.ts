import { RefObject, useEffect } from 'react'

export const UNMOUNTING = 'unmounting'

/**
 * Delays a node's unmounting so that an animation may be applied.
 * An animation *must* be applied, or the node will not unmount.
 */
export default function useUnmount(node: RefObject<HTMLElement>) {
  useEffect(() => {
    const current = node.current
    const parent = current?.parentElement
    const removeChild = parent?.removeChild
    if (parent && removeChild) {
      parent.removeChild = function <T extends Node>(child: T) {
        if ((child as Node) === current) {
          current.classList.add(UNMOUNTING)
          current.onanimationend = () => {
            removeChild.call(parent, child)
          }
          return child
        } else {
          return removeChild.call(parent, child) as T
        }
      }
    }
    return () => {
      if (parent && removeChild) {
        parent.removeChild = removeChild
      }
    }
  }, [node])
}
