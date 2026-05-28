import { DimensionValue } from 'react-native'
import { NotImplementedError } from 'utilities/src/errors'
import { ActiveDelegation } from 'wallet/src/features/smartWallet/types'

export interface UseVisibleDelegationsParams {
  data: ActiveDelegation[]
}

export interface UseVisibleDelegationsResult {
  maxHeight: DimensionValue
  visibleItems: ActiveDelegation[]
}

export function useVisibleDelegations(_: UseVisibleDelegationsParams): UseVisibleDelegationsResult {
  throw new NotImplementedError('useVisibleDelegations')
}
