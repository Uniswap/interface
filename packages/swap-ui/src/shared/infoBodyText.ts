import type { InfoContainer } from '../types'

/**
 * Body text size for an info body in each shell. Adapters that compose text into a body (the
 * gradient "UniswapX" word) use it too, so the composed word matches the sentence around it.
 */
export function infoBodyTextVariant(container: InfoContainer): 'body4' | 'body2' {
  return container === 'tooltip' ? 'body4' : 'body2'
}
