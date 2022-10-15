import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { selectTokensMetadataDisplayType } from 'src/features/wallet/selectors'
import { TokensMetadataDisplayType } from 'src/features/wallet/types'
import { cycleTokensMetadataDisplayType } from 'src/features/wallet/walletSlice'

export function useTokensMetadataDisplayType(): [TokensMetadataDisplayType, () => void] {
  const dispatch = useAppDispatch()

  const metadataDisplayType = useAppSelector(selectTokensMetadataDisplayType)
  const cycleMetadata = useCallback(() => dispatch(cycleTokensMetadataDisplayType()), [dispatch])

  return [metadataDisplayType, cycleMetadata]
}
