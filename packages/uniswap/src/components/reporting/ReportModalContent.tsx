import type { PropsWithChildren } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type ReportModalContentProps = PropsWithChildren<{
  keyboardHeight: number
}>

export function ReportModalContent(_: ReportModalContentProps): JSX.Element {
  throw new PlatformSplitStubError('ReportModalContent')
}
