import { PropsWithChildren } from 'react'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { NotImplementedError } from 'utilities/src/errors'

export function InfoTooltip(_props: PropsWithChildren<InfoTooltipProps>): JSX.Element {
  throw new NotImplementedError('InfoTooltip')
}
