import { renderHookWithProviders, renderWithProviders } from 'src/test/render'

// re-export everything
export * from '@testing-library/react-native'
// override render method
export { renderWithProviders as render, renderHookWithProviders as renderHook }

/**
 * Reads a React prop from the nearest fiber that defines it, walking up from a DOM element.
 * Replacement for RNTL's `instance.props[...]` under vitest/jsdom, where queries return DOM
 * elements (React Native props like numberOfLines never reach the DOM).
 */
export function getNearestFiberProp(element: unknown, propName: string): unknown {
  const node = element as Record<string, unknown>
  const fiberKey = Object.keys(node).find((k) => k.startsWith('__reactFiber$'))
  const propsKey = Object.keys(node).find((k) => k.startsWith('__reactProps$'))
  let fiber = fiberKey ? (node as any)[fiberKey] : undefined
  // the DOM node can point at the stale half of React's double buffer; __reactProps$ is always
  // current, so use it to pick the committed fiber
  if (fiber && propsKey && fiber.memoizedProps !== (node as any)[propsKey] && fiber.alternate) {
    fiber = fiber.alternate
  }
  for (let depth = 0; fiber && depth < 20; depth += 1) {
    const props = fiber.memoizedProps
    if (props && propName in props) {
      return props[propName]
    }
    fiber = fiber.return
  }
  return undefined
}
