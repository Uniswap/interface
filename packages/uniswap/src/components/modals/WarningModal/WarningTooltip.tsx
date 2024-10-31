import { PropsWithChildren } from 'react'
import { WarningTooltipProps } from 'uniswap/src/components/modals/WarningModal/WarningTooltipProps'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function WarningTooltip(_props: PropsWithChildren<WarningTooltipProps>): JSX.Element {
  throw new PlatformSplitStubError('WarningTooltip')
}
