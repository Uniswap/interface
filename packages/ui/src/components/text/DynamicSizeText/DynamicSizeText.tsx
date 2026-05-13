import React from 'react'
import type { TextProps } from 'ui/src/components/text/Text'
import { PlatformSplitStubError } from 'utilities/src/errors'

type FontSizeOptions = {
  minWebFontSize?: number
  maxWebFontSize?: number
  floatingSuffix?: React.ReactNode
}

export type DynamicSizeTextProps = TextProps & FontSizeOptions

export function DynamicSizeText(_: DynamicSizeTextProps): JSX.Element {
  throw new PlatformSplitStubError('DynamicSizeText')
}
