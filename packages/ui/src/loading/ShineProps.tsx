import type { FlexProps } from 'ui/src/components/layout'

export type ShineProps = {
  shimmerDurationSeconds?: number
  disabled?: boolean
  children: JSX.Element
} & Omit<FlexProps, 'children'>
