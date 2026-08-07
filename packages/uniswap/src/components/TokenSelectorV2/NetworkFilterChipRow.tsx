import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import {
  NETWORK_CHIP_BORDER_RADIUS,
  NETWORK_CHIP_COMPACT_VISIBLE_COUNT,
} from 'uniswap/src/components/TokenSelectorV2/constants'
import { HorizontalFadeScroll } from 'uniswap/src/components/TokenSelectorV2/HorizontalFadeScroll'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const CHIP_TOOLTIP_DELAY = { close: 0, open: 0 }

export type NetworkChipRowMode = 'compact' | 'labeled'

export interface NetworkFilterChipRowProps {
  chainIds: UniverseChainId[]
  selectedChain: UniverseChainId | null
  onPressChain: (chainId: UniverseChainId | null) => void
  mode: NetworkChipRowMode
  isTestnetModeEnabled: boolean
  tieredOptions?: TieredNetworkOptions
}

function NetworkChip({
  chainId,
  label,
  showLabel,
  active,
  onPress,
}: {
  chainId: UniverseChainId | null
  label: string
  showLabel: boolean
  active: boolean
  onPress: () => void
}): JSX.Element {
  const chip = (
    <TouchableArea
      accessibilityLabel={label}
      accessibilityRole="button"
      // aria-selected (not accessibilityState) — Tamagui forwards it to the DOM on web; RN treats it as the alias
      aria-selected={active}
      testID={`${TestID.TokenSelectorV2NetworkChipPrefix}${chainId ?? 'all'}`}
      onPress={onPress}
    >
      <Flex
        row
        alignItems="center"
        backgroundColor={active ? '$accent2' : '$surface1'}
        borderColor={active ? '$accent1' : '$surface3'}
        borderRadius={NETWORK_CHIP_BORDER_RADIUS}
        borderWidth={1}
        gap="$spacing6"
        p="$spacing6"
      >
        <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
        {showLabel && (
          <Text color="$neutral1" pr="$spacing2" variant="buttonLabel4">
            {label}
          </Text>
        )}
      </Flex>
    </TouchableArea>
  )

  // Labeled chips already show the name inline; icon-only chips reveal it on hover (web).
  if (showLabel) {
    return chip
  }

  return (
    <Tooltip delay={CHIP_TOOLTIP_DELAY} placement="top" restMs={0}>
      <Tooltip.Trigger>{chip}</Tooltip.Trigger>
      <Tooltip.Content>
        <Text variant="body4">{label}</Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}

/**
 * Horizontal network chip row under the search bar (SWAP-3041, Figma 750:13034).
 * Selecting a chip only updates `chainFilter` — it never mounts a different list type. Single select;
 * tapping the active chip (or the leading All-Networks chip, hidden in testnet mode) resets to `null`.
 * `mode`: 'compact' = icon-only chips + a +N overflow chip (input); 'labeled' = icon+label chips (output).
 */
export const NetworkFilterChipRow = memo(function NetworkFilterChipRow({
  chainIds,
  selectedChain,
  onPressChain,
  mode,
  isTestnetModeEnabled,
  tieredOptions,
}: NetworkFilterChipRowProps): JSX.Element | null {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)

  // Balance-tiered ordering when available (chains the user holds on come first).
  const orderedChainIds = useMemo(() => {
    if (!tieredOptions) {
      return chainIds
    }
    const tiered = [...tieredOptions.withBalances, ...tieredOptions.otherNetworks].map((option) => option.chainId)
    const known = new Set(tiered)
    return [...tiered.filter((chainId) => chainIds.includes(chainId)), ...chainIds.filter((id) => !known.has(id))]
  }, [tieredOptions, chainIds])

  if (chainIds.length <= 1) {
    return null
  }

  const isCompact = mode === 'compact'
  let visibleChainIds =
    isCompact && !showAll ? orderedChainIds.slice(0, NETWORK_CHIP_COMPACT_VISIBLE_COUNT) : orderedChainIds
  // The selected chain must always have a visible (active) chip, even when it falls in the +N overflow.
  if (selectedChain !== null && !visibleChainIds.includes(selectedChain) && orderedChainIds.includes(selectedChain)) {
    visibleChainIds = [...visibleChainIds.slice(0, -1), selectedChain]
  }
  const overflowCount = orderedChainIds.length - visibleChainIds.length

  return (
    <Flex testID={TestID.TokenSelectorV2NetworkChipRow}>
      <HorizontalFadeScroll>
        <Flex row gap="$spacing8" px="$spacing12" py="$none">
          {!isTestnetModeEnabled && (
            <NetworkChip
              active={selectedChain === null}
              chainId={null}
              label={t('transaction.network.all')}
              showLabel={false}
              onPress={(): void => onPressChain(null)}
            />
          )}
          {visibleChainIds.map((chainId) => (
            <NetworkChip
              key={chainId}
              active={selectedChain === chainId}
              chainId={chainId}
              label={getChainLabel(chainId)}
              showLabel={!isCompact}
              onPress={(): void => onPressChain(selectedChain === chainId ? null : chainId)}
            />
          ))}
          {overflowCount > 0 && (
            <TouchableArea
              accessibilityLabel={t('tokens.selectorV2.chips.showMore', { count: overflowCount })}
              accessibilityRole="button"
              onPress={(): void => setShowAll(true)}
            >
              <Flex
                alignItems="center"
                backgroundColor="$surface1"
                borderColor="$surface3"
                borderRadius={NETWORK_CHIP_BORDER_RADIUS}
                borderWidth={1}
                justifyContent="center"
                px="$spacing8"
                py="$spacing6"
              >
                <Text color="$neutral2" variant="buttonLabel4">
                  {t('tokens.selectorV2.chips.overflow', { count: overflowCount })}
                </Text>
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      </HorizontalFadeScroll>
    </Flex>
  )
})
