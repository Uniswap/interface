import { RefObject } from 'react'

export function isAnimating(node: Animatable | Document) {
  return (node.getAnimations().length ?? 0) > 0
}

export const UNMOUNTING = 'unmounting'

/**
 * Delays a node's unmounting until any animations on that node are finished, so that an unmounting
 * animation may be applied. If there is no animation, this is a no-op.
 *
 * CSS should target the UNMOUNTING class to determine when to apply an unmounting animation.
 */
export function delayUnmountForAnimation(node: RefObject<HTMLElement>) {
  const current = node.current
  const parent = current?.parentElement
  const removeChild = parent?.removeChild
  if (parent && removeChild) {
    parent.removeChild = function <T extends Node>(child: T) {
      if ((child as Node) === current) {
        current.classList.add(UNMOUNTING)
        if (isAnimating(current)) {
          current.addEventListener('animationend', () => {
            removeChild.call(parent, child)
          })
        } else {
          removeChild.call(parent, child)
        }
        return child
      } else {
        return removeChild.call(parent, child) as T
      }
    }
  }
}
