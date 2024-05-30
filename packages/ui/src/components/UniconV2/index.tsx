import React from 'react'
import { UniconV2Props } from 'ui/src/components/UniconV2/types'
import { NotImplementedError } from 'utilities/src/errors'

export const UniconV2: React.FC<UniconV2Props> = () => {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}
