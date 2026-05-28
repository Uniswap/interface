import type { PropsWithChildren } from 'react'

export interface SpinningBorderIconProps {
  children: React.ReactNode
  layoutSize: number
}

/**
 * Platform-specific implementations:
 * - Web: Uses CSS animations (SpinningBorderIcon.web.tsx)
 * - Native: Uses react-native-reanimated (SpinningBorderIcon.native.tsx)
 */
export function SpinningBorderIcon(_props: PropsWithChildren<SpinningBorderIconProps>): JSX.Element {
  throw new Error('SpinningBorderIcon: Implemented in `.native.tsx` and `.web.tsx` files')
}
