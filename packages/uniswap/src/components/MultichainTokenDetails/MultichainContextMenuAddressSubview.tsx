import type { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { MultichainAddressList } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressList'
import {
  MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_MAX_HEIGHT,
  MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_WIDTH,
} from 'uniswap/src/components/MultichainTokenDetails/multichainContextMenuLayout'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'

type MultichainContextMenuAddressSubviewProps = {
  orderedEntries: MultichainTokenEntry[]
  /** Per-chain copy; `chainId` identifies which row was copied (matches {@link MultichainAddressList}). */
  onCopyAddress: (address: string, chainId: UniverseChainId) => void | Promise<void>
  onBack: () => void
  title: string
  /** Skip the bordered/fixed-width card chrome — use when the parent surface (e.g. a popover) already supplies it. */
  bare?: boolean
  /** When true, omits chrome and fills the parent flex container (used inside {@link MultichainContextMenuExpandContent}). */
  embedded?: boolean
  /** Override the panel size. Only meaningful with `bare`; otherwise the standard menu layout constants apply. */
  width?: number
  maxHeight?: number
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
  bare = false,
  embedded = false,
  width,
  maxHeight,
}: MultichainContextMenuAddressSubviewProps): JSX.Element {
  const isSheet = useMedia().sm
  const isEmbedded = embedded || bare
  const showChrome = !isSheet && !isEmbedded

  const panel = (
    <Flex
      alignItems="stretch"
      overflow="hidden"
      flex={embedded ? 1 : undefined}
      minHeight={embedded ? 0 : undefined}
      width={showChrome ? (width ?? MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_WIDTH) : width}
      maxHeight={showChrome ? (maxHeight ?? MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_MAX_HEIGHT) : maxHeight}
      gap={bare ? '$spacing8' : undefined}
      {...(isEmbedded
        ? undefined
        : {
            pt: '$spacing8',
            px: '$spacing8',
          })}
      {...(showChrome
        ? {
            backgroundColor: '$surface1',
            borderRadius: '$rounded20',
            borderWidth: 1,
            borderColor: '$surface3',
          }
        : undefined)}
    >
      <TouchableArea
        row
        alignItems="center"
        gap="$spacing8"
        px={bare ? 0 : '$spacing8'}
        py="$spacing8"
        onPress={onBack}
      >
        <RotatableChevron direction="left" color="$neutral2" size="$icon.16" />
        <Text variant="buttonLabel3" color="$neutral1" flex={1} textAlign="center">
          {title}
        </Text>
      </TouchableArea>
      <Flex flex={1} minHeight={0}>
        <MultichainAddressList
          chains={orderedEntries}
          renderedInModal={isSheet}
          padding={bare ? 0 : undefined}
          onCopyAddress={onCopyAddress}
        />
      </Flex>
    </Flex>
  )

  if (embedded) {
    return panel
  }

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
      {panel}
    </div>
  )
}
