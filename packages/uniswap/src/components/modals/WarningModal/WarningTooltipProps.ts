import { ReactNode } from 'react'
import { PopperProps } from 'ui/src'

export type WarningTooltipProps = {
  title?: string
  text: ReactNode
  icon?: Maybe<JSX.Element>
  button: ReactNode
  trigger: ReactNode
  triggerPlacement?: 'start' | 'end'
} & Pick<PopperProps, 'placement'>
