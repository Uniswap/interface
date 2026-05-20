import { Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { MultichainAddressList } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressList'
import {
  MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_MAX_HEIGHT,
  MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_WIDTH,
} from 'uniswap/src/components/MultichainTokenDetails/multichainContextMenuLayout'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

type MultichainContextMenuAddressSubviewProps = {
  orderedEntries: MultichainTokenEntry[]
  /** Per-chain copy; `chainId` identifies which row was copied (matches {@link MultichainAddressList}). */
  onCopyAddress: (address: string, chainId: UniverseChainId) => void | Promise<void>
  onBack: () => void
  title: string
}

/**
 * Second panel of multichain token context menus: back affordance + per-chain addresses.
 * Wrapped in a div to stop propagation to parent rows (web).
 */
export function MultichainContextMenuAddressSubview({
  orderedEntries,
  onCopyAddress,
  onBack,
  title,
}: MultichainContextMenuAddressSubviewProps): JSX.Element {
  const isSheet = useMedia().sm
  return (
    // oxlint-disable-next-line react/forbid-elements -- needed to stop event propagation to parent row
    <div
      onContextMenu={(e): void => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={(e): void => {
        e.stopPropagation()
      }}
      onMouseDown={(e): void => {
        e.stopPropagation()
      }}
    >
      <Flex
        alignItems="stretch"
        pt="$spacing8"
        px="$spacing8"
        {...(isSheet
          ? undefined
          : {
              backgroundColor: '$surface1',
              borderRadius: '$rounded20',
              borderWidth: 1,
              borderColor: '$surface3',
              width: MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_WIDTH,
              maxHeight: MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_MAX_HEIGHT,
            })}
      >
        <TouchableArea row alignItems="center" gap="$spacing8" p="$spacing8" onPress={onBack}>
          <RotatableChevron direction="left" color="$neutral2" size="$icon.16" />
          <Text variant="buttonLabel3" color="$neutral1" flex={1} textAlign="center">
            {title}
          </Text>
        </TouchableArea>
        <Flex flex={1} minHeight={0}>
          <MultichainAddressList chains={orderedEntries} renderedInModal={isSheet} onCopyAddress={onCopyAddress} />
        </Flex>
      </Flex>
    </div>
  )
}
