import { useState } from 'react'
import { AnimatableCopyIcon, Flex, TouchableArea, useMedia } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { MultichainAddressList } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressList'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import {
  MultichainPillDropdown,
  useMultichainPopoverContentProps,
} from '~/pages/TokenDetails/components/info/MultichainPillDropdown'
import { useTokenAddressCopy } from '~/pages/TokenDetails/hooks/useTokenAddressCopy'

interface TokenDetailsHeaderAddressCopyMobileProps {
  displayAddress: string
  isNative: boolean
  chainId: UniverseChainId
  isMultiChainAsset: boolean
  selectedChainId: UniverseChainId | undefined
  multichainEntries: MultichainTokenEntry[]
}

/**
 * Copy-to-clipboard affordance shown next to the token name on mobile web (desktop renders address
 * copy in its own header row). Tapping copies the contract address; for multichain tokens set to
 * "All Networks" it opens the same per-network address list used by the About section.
 */
export function TokenDetailsHeaderAddressCopyMobile({
  displayAddress,
  isNative,
  chainId,
  isMultiChainAsset,
  selectedChainId,
  multichainEntries,
}: TokenDetailsHeaderAddressCopyMobileProps): JSX.Element | null {
  const media = useMedia()
  const popoverContentProps = useMultichainPopoverContentProps()
  const { isCopied, copy, onCopyMultichainAddress } = useTokenAddressCopy({ displayAddress, chainId })
  const [isOpen, setIsOpen] = useState(false)

  if (!media.sm || isNative) {
    return null
  }

  // "All Networks" multichain tokens have no single canonical address, so surface the per-network list.
  const showMultichainList = isMultiChainAsset && !selectedChainId

  const copyTrigger = (
    <TouchableArea testID={TestID.TokenDetailsCopyAddressButton} onPress={showMultichainList ? undefined : copy}>
      <AnimatableCopyIcon isCopied={isCopied} size={iconSizes.icon16} textColor="$neutral2" />
    </TouchableArea>
  )

  // Center the icon against the token name regardless of the trigger wrapping (the multichain
  // Popover.Trigger below would otherwise drop the trigger's alignSelf and bottom-align to the row).
  return (
    <Flex alignSelf="center">
      {showMultichainList ? (
        <MultichainPillDropdown
          testID={TestID.TokenDetailsCopyAddressButton}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          modalName={ModalName.MultichainAddressModal}
          trigger={copyTrigger}
          popoverContentProps={popoverContentProps}
        >
          <MultichainAddressList chains={multichainEntries} onCopyAddress={onCopyMultichainAddress} />
        </MultichainPillDropdown>
      ) : (
        copyTrigger
      )}
    </Flex>
  )
}
