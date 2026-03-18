import { RefObject, useEffect } from 'react'

/**
 * Checks whether a given node is currently animating.
 *
 * @param node - The node to check for ongoing animations.
 * @returns - true if the node is animating; false otherwise.
 */
function isAnimating(node?: Animatable | Document): boolean {
  return (node?.getAnimations().length ?? 0) > 0
}

/**
 * This hook runs an unmounting animation on a specified node.
 *
 * The hook will also run the animation on any additional elements specified in
 * the `animatedElements` parameter. If no additional elements are specified,
 * the animation will only run on the provided node.
 *
 * After any of the animated elements have completed their animation, `node` is removed from its parent.
 *
 * @param node - The node to animate and remove.
 * @param getAnimatingClass - A function that returns the CSS class to add to the animating elements.
 * @param animatedElements - Additional elements to animate.
 * @param skip - Whether to skip the animation and remove the node immediately.
 */
export function useUnmountingAnimation({
  node,
  getAnimatingClass,
  animatedElements,
  skip = false,
}: {
  node: RefObject<HTMLElement | null>
  getAnimatingClass: () => string
  animatedElements?: RefObject<HTMLElement | null>[]
  skip?: boolean
}) {
  useEffect(() => {
    const current = node.current

    // Gather all elements to animate, defaulting to the current node if none are specified.
    const animated = animatedElements?.map((element) => element.current) ?? [current]
    const parent = current?.parentElement
    const removeChild = parent?.removeChild

    // If we can't remove the child or skipping is requested, stop here.
    if (!(parent && removeChild) || skip) {
      return undefined
    }

    // Override the parent's removeChild function to add our animation logic
    parent.removeChild = function <T extends Node>(child: T) {
      // If the current child is the one being removed and it's supposed to animate
      if ((child as Node) === current) {
        // Add animation class to all elements
        animated.forEach((element) => element?.classList.add(getAnimatingClass()))

        // Check if any of the animated elements is animating
        const animating = animated.find((element) => isAnimating(element ?? undefined))
        if (animating) {
          // If an element is animating, we wait for the animation to end before removing the child
          animating.addEventListener('animationend', (x) => {
            // This check is needed because the animationend event will fire for all animations on the
            // element or its children.
            if (x.target === animating) {
              removeChild.call(parent, child)
            }
          })
        } else {
          // If no element is animating, we remove the child immediately
          removeChild.call(parent, child)
        }
        // We've handled the removal, so we return the child
        return child
      } else {
        // If the child isn't the one we're supposed to animate, remove it normally
        return removeChild.call(parent, child) as T
      }
    }

    // Reset the removeChild function to its original value when the component is unmounted
    return () => {
      parent.removeChild = removeChild
    }
  }, [animatedElements, getAnimatingClass, node, skip])
}
