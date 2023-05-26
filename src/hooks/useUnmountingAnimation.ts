import { RefObject, useEffect } from 'react'

function isAnimating(node?: Animatable | Document) {
  return (node?.getAnimations?.().length ?? 0) > 0
}

export function useUnmountingAnimation(
  node: RefObject<HTMLElement>,
  getAnimatingClass: () => string,
  animatedElements?: RefObject<HTMLElement>[],
  skip = false
) {
  useEffect(() => {
    const current = node.current
    const animated = animatedElements?.map((element) => element.current) ?? [current]
    const parent = current?.parentElement
    const removeChild = parent?.removeChild
    if (!(parent && removeChild) || skip) return

    parent.removeChild = function <T extends Node>(child: T) {
      if ((child as Node) === current && animated) {
        animated.forEach((element) => element?.classList.add(getAnimatingClass()))
        const animating = animated.find((element) => isAnimating(element ?? undefined))
        if (animating) {
          animating?.addEventListener('animationend', (x) => {
            // This check is needed because the animationend event will fire for all animations on the
            // element or its children.
            if (x.target === animating) {
              removeChild.call(parent, child)
            }
          })
        } else {
          removeChild.call(parent, child)
        }
        return child
      } else {
        return removeChild.call(parent, child) as T
      }
    }
    return () => {
      parent.removeChild = removeChild
    }
  }, [animatedElements, getAnimatingClass, node, skip])
}
