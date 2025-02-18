import { Fragment } from 'react'
import { TokenItemWrapperProps } from 'uniswap/src/components/TokenSelector/types'

export function TokenOptionItemWrapper({ children }: TokenItemWrapperProps): JSX.Element {
  return <Fragment>{children}</Fragment>
}
