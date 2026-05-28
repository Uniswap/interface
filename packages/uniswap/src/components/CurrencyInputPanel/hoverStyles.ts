export const HOVER_REVEAL_TRANSFORM = [{ translateY: -8 }, { scale: 0.95 }] as const

/** Transition used on exit (no stagger delay) */
export const HOVER_REVEAL_EXIT_TRANSITION = 'opacity 200ms ease-out, transform 200ms ease-out'

/** Returns $group-hover style with a staggered entrance transition */
export function getStaggeredGroupHoverStyle(index: number): {
  opacity: number
  transform: readonly { translateY: number }[]
  scale: number
  transition: string
} {
  const delay = index * 40
  return {
    opacity: 1,
    transform: [{ translateY: 0 }],
    scale: 1,
    transition: `opacity 200ms ease-out ${delay}ms, transform 200ms ease-out ${delay}ms`,
  }
}
