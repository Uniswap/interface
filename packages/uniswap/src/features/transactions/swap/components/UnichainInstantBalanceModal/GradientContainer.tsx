import { ReactNode } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type GradientContainerProps = {
  toTokenColor: string
  children: ReactNode
}

export function GradientContainer(_: React.PropsWithChildren<GradientContainerProps>): JSX.Element {
  throw new PlatformSplitStubError('GradientContainer')
}
