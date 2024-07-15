import { PropsWithChildren } from 'react'
import { NotImplementedError } from 'utilities/src/errors'
import { WarningTooltipProps } from 'wallet/src/components/modals/WarningModal/WarningTooltipProps'

export function WarningTooltip(_props: PropsWithChildren<WarningTooltipProps>): JSX.Element {
  throw new NotImplementedError(
    'current tooltip implementation does not work properly for native mobile'
  )
}
