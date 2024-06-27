import { SkeletonProps } from './SkeletonProps'

/**
 * Replaces Skeleton component during e2e testing to avoid test freezes
 * caused linear gradient
 */
export function Skeleton({ children }: SkeletonProps): JSX.Element {
  return children
}
