import { Flex, styled } from 'ui/src'

/**
 * Platform-specific implementations:
 * - Web: Uses CSS animations (SharedSnowflakeComponents.web.tsx)
 * - Native: Uses react-native-reanimated (SharedSnowflakeComponents.native.tsx)
 */

// Shared styled components
export const SnowflakeContainer = styled(Flex, {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
})

export const MouseGlow = styled(Flex, {
  position: 'absolute',
  background:
    'radial-gradient(circle, rgba(252, 116, 254, 0.8) 0%, rgba(252, 116, 254, 0.6) 30%, rgba(252, 116, 254, 0.2) 60%, rgba(252, 116, 254, 0) 100%)',
  borderRadius: '$rounded32',
  filter: 'blur(40px)',
  pointerEvents: 'none',
  transition: 'opacity 200ms ease-out',
})

interface RenderSnowflakesConfig {
  snowflakes: Array<{
    id: number
    size: number
    opacity: number
    blur: number
    left: number
    duration: number
    drift: number
    rotationSpeed: number
    rotationDirection: 1 | -1
    startY: number
  }>
  containerHeight: number
  removeSnowflake: (id: number) => void
  getSnowflakeDrift?: (id: number) => { x: number; y: number }
  keyPrefix?: string
}

export function renderSnowflakesWeb(_config: RenderSnowflakesConfig): JSX.Element {
  throw new Error('renderSnowflakesWeb: Implemented in .native.tsx and .web.tsx')
}

export function renderSnowflakesNative(_config: RenderSnowflakesConfig): JSX.Element[] {
  throw new Error('renderSnowflakesNative: Implemented in .native.tsx and .web.tsx')
}
