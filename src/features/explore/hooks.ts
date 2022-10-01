import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { ClientSideOrderBy, CoingeckoOrderBy } from 'src/features/explore/types'

import { selectTokensMetadataDisplayType } from 'src/features/wallet/selectors'
import { cycleTokensMetadataDisplayType } from 'src/features/wallet/walletSlice'

export function useTokenMetadataDisplayType(): [CoingeckoOrderBy | ClientSideOrderBy, () => void] {
  const dispatch = useAppDispatch()

  const metadataDisplayType = useAppSelector(selectTokensMetadataDisplayType)
  const cycleMetadata = useCallback(() => dispatch(cycleTokensMetadataDisplayType()), [dispatch])

  return [metadataDisplayType, cycleMetadata]
}
