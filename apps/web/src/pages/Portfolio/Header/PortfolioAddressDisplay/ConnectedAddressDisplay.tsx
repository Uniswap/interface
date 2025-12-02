/* eslint-disable-next-line no-restricted-imports, no-restricted-syntax */
import { MultiBlockchainAddressDisplay } from 'components/AccountDetails/MultiBlockchainAddressDisplay'
import StatusIcon from 'components/StatusIcon'
import { useActiveAddresses } from 'features/accounts/store/hooks'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme/iconSizes'

export function ConnectedAddressDisplay({ isCompact }: { isCompact: boolean }) {
  const activeAddresses = useActiveAddresses()

  // Use primary address for icon (EVM first, then SVM)
  const addressToDisplay = activeAddresses.evmAddress ?? activeAddresses.svmAddress

  if (!addressToDisplay) {
    return null
  }

  const iconSize = isCompact ? iconSizes.icon24 : iconSizes.icon48

  return (
    <Flex row alignItems="center" gap="$spacing12">
      <StatusIcon size={iconSize} showMiniIcons={false} />
      <MultiBlockchainAddressDisplay hideAddressInSubtitle={isCompact} />
    </Flex>
  )
}
