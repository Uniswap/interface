import { RefObject, useEffect } from 'react'

export const UNMOUNTING = 'unmounting'

/**
 * Delays a node's unmounting until any animations on that node are finished, so that an unmounting
 * animation may be applied. If there is no animation, this is a no-op.
 *
 * CSS should target the UNMOUNTING class to determine when to apply an unmounting animation.
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
          if (current.getAnimations().length) {
            current.onanimationend = () => {
              removeChild.call(parent, child)
            }
          } else {
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
