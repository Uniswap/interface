import { ReactNode } from 'react'
import { PopperProps } from 'ui/src'

export type WarningTooltipProps = {
  title?: string
  text: string
  button: ReactNode
  trigger: ReactNode
  triggerPlacement?: 'start' | 'end'
} & Pick<PopperProps, 'placement'>
