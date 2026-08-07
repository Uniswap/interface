import type { ReactNode } from 'react'

export interface UniconProps {
  /** Any string for deterministic avatar generation */
  input: string
  /** Size in pixels (default: 32) */
  size?: number
  /** Additional CSS classes */
  className?: string
  /** Custom icon to render instead of the default generated icon. Will be colored with the computed unicon color. */
  icon?: ReactNode
  /** When true, removes the background circle and scales the shape to fill the full container. */
  bare?: boolean
}
