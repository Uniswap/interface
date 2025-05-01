import type { FlexProps } from 'ui/src/components/layout'

export type ShineProps = {
  disabled?: boolean
  children: JSX.Element
} & Omit<FlexProps, 'children'>
