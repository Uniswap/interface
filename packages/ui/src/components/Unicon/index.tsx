import React from 'react'
import { UniconProps } from 'ui/src/components/Unicon/types' // Assuming UniconProps might be generic enough or renamed separately
import { PlatformSplitStubError } from 'utilities/src/errors'

export const NexTradeIcon: React.FC<UniconProps> = () => { // Renamed Unicon to NexTradeIcon
  throw new PlatformSplitStubError('NexTradeIcon')
}
