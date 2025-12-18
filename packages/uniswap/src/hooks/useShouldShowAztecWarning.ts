import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { AZTEC_ADDRESS } from 'uniswap/src/constants/addresses'

export const shouldShowAztecWarning = ({
  address,
  isAztecDisabled,
}: {
  address: Address
  isAztecDisabled: boolean
}): boolean => {
  const isAztec = address.toLowerCase() === AZTEC_ADDRESS.toLowerCase()
  return isAztec && isAztecDisabled
}

export const useShouldShowAztecWarning = (address: Address): boolean => {
  const isAztecDisabled = useFeatureFlag(FeatureFlags.DisableAztecToken)
  return shouldShowAztecWarning({ address, isAztecDisabled })
}
