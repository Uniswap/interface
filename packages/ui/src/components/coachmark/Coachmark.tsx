import type { TooltipCompatProps } from '@universe/mycelium/tooltip-compat'
import { ReactNode } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * A coachmark is a one-time educational callout used to introduce a new feature.
 * Unlike a tooltip, it isn't hover/focus-driven and doesn't re-appear after each interaction.
 */
export interface CoachmarkProps {
  open: boolean
  onDismiss: () => void
  title?: string
  text: string
  width?: number
  placement?: TooltipCompatProps['placement']
  offset?: TooltipCompatProps['offset']
  zIndex?: number
  testID?: string
  children: ReactNode
}

export function Coachmark(_props: CoachmarkProps): JSX.Element {
  throw new PlatformSplitStubError('Coachmark')
}
