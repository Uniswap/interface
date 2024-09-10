import React from 'react'
import { UniconProps } from 'ui/src/components/Unicon/types'
import { NotImplementedError } from 'utilities/src/errors'

export const Unicon: React.FC<UniconProps> = () => {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}
