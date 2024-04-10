import { ReactNode } from 'react'
import { PopperProps } from 'ui/src'

export type WarningTooltipProps = {
  text: string
  button: ReactNode
  icon: ReactNode
} & Pick<PopperProps, 'placement'>
