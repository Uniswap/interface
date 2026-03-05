/* eslint-disable-next-line no-restricted-imports, no-restricted-syntax */

import { useMemo } from 'react'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { MultiBlockchainAddressDisplay } from '~/components/AccountDetails/MultiBlockchainAddressDisplay'
import StatusIcon from '~/components/StatusIcon'
import { useResolvedAddresses } from '~/pages/Portfolio/hooks/useResolvedAddresses'

interface ConnectedAddressDisplayProps {
  isCompact: boolean
}

export function ConnectedAddressDisplay({ isCompact }: ConnectedAddressDisplayProps) {
  const { evmAddress, svmAddress, isExternalWallet } = useResolvedAddresses()

  const primaryAddress = evmAddress ?? svmAddress

  const externalAddress = useMemo(() => {
    if (!isExternalWallet || !primaryAddress) {
      return undefined
    }
    return {
      address: primaryAddress,
      platform: evmAddress ? Platform.EVM : Platform.SVM,
    }
  }, [isExternalWallet, primaryAddress, evmAddress])

  if (!primaryAddress) {
    return null
  }

  const iconSize = isCompact ? iconSizes.icon24 : iconSizes.icon48

  return (
    <Flex row alignItems="center" gap="$spacing12" shrink>
      <StatusIcon address={primaryAddress} size={iconSize} showMiniIcons={false} />
      <MultiBlockchainAddressDisplay hideAddressInSubtitle={isCompact} externalAddress={externalAddress} />
    </Flex>
  )
}
