import React from 'react'
import { UniconProps } from 'ui/src/components/Unicon/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const Unicon: React.FC<UniconProps> = () => {
  throw new PlatformSplitStubError('Unicon')
}
