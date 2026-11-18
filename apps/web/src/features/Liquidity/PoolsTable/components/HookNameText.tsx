import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { useState } from 'react'
import { UniswapBuiltHookMark } from 'uniswap/src/components/logos/UniswapBuiltHookMark'
import type { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { shortenAddress } from 'utilities/src/addresses'
import { useEvent } from 'utilities/src/react/hooks'
import { Portal } from '~/components/Portal/Portal'
import { MouseoverTooltip } from '~/components/Tooltip'
import { HookDetailsModal } from '~/features/Liquidity/HookDetailsModal'
import { HookTooltip } from '~/features/Liquidity/HookTooltip'

export function HookNameText({
  hookEntry,
  chainId,
  provenance,
}: {
  hookEntry: HookEntry
  chainId: UniverseChainId
  provenance?: UniswapHookProvenance
}) {
  const [showDetails, setShowDetails] = useState(false)

  const handlePress = useEvent((e: { preventDefault: () => void; stopPropagation: () => void }) => {
    // The whole row is a link to the pool page — keep this press from triggering it.
    e.preventDefault()
    e.stopPropagation()
    setShowDetails(true)
  })

  // Rendered bare for registry hooks (DOM unchanged); hooks Uniswap built or configured get the mark too.
  const nameText = (
    <Text
      variant="body3"
      color="$neutral2"
      maxWidth={160}
      minWidth={0}
      flexShrink={1}
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      cursor="pointer"
      hoverStyle={{ color: '$neutral1' }}
      onPress={handlePress}
    >
      {hookEntry.name || shortenAddress({ address: hookEntry.address })}
    </Text>
  )

  return (
    <>
      {/* minWidth: 0 on the Popover's reference wrapper: its default min-width:auto floors the flex
          item at the full nowrap name width, so squeezed rows clip instead of ellipsizing. */}
      <MouseoverTooltip
        text={<HookTooltip hookEntry={hookEntry} provenance={provenance} />}
        placement="top"
        style={{ minWidth: 0 }}
      >
        {provenance !== undefined ? (
          // onPress on the wrapper (not just the name) so clicking the mark opens the hook details modal
          // too, rather than falling through to the row's pool link — matching the position badge.
          // flexShrink: 1 so the wrapper shrinks like the bare name Text does — Tamagui stacks default
          // to flexShrink: 0, which would let a long marked name overflow instead of ellipsizing.
          <Flex row alignItems="center" gap="$gap4" minWidth={0} flexShrink={1} cursor="pointer" onPress={handlePress}>
            <UniswapBuiltHookMark />
            {nameText}
          </Flex>
        ) : (
          nameText
        )}
      </MouseoverTooltip>
      {showDetails ? (
        // The cell lives inside the row's link, and a dialog mounted inside an anchor would nest
        // anchors and bubble clicks into it.
        <Portal>
          <HookDetailsModal hookEntry={hookEntry} chainId={chainId} isOpen onClose={() => setShowDetails(false)} />
        </Portal>
      ) : null}
    </>
  )
}
