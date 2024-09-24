import { PropsWithChildren } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'
import { WarningTooltipProps } from 'wallet/src/components/modals/WarningModal/WarningTooltipProps'

export function WarningTooltip(_props: PropsWithChildren<WarningTooltipProps>): JSX.Element {
  throw new PlatformSplitStubError('WarningTooltip')
}
