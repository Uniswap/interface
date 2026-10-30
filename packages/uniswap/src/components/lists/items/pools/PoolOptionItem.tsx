import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { Flex, iconSizes, type ModifierPressProps, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { FocusedRowControl, OptionItem } from 'uniswap/src/components/lists/items/OptionItem'
import {
  PoolContextMenuAction,
  PoolOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/pools/PoolOptionItemContextMenu'
import { hasPoolSearchStats, PoolOptionItemStats } from 'uniswap/src/components/lists/items/pools/PoolOptionItemStats'
import { usePoolIdentityLabels } from 'uniswap/src/components/lists/items/pools/usePoolIdentityLabels'
import { CurrencyInfo, PoolSearchStats } from 'uniswap/src/features/dataApi/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

interface PoolOptionItemProps extends ModifierPressProps {
  token0CurrencyInfo: CurrencyInfo
  token1CurrencyInfo: CurrencyInfo
  poolId: string
  chainId: UniverseChainId
  onPress: () => void
  protocolVersion: ProtocolVersion
  hookAddress?: string
  feeTier: number
  focusedRowControl?: FocusedRowControl
  searchStats?: PoolSearchStats
}

const SEPARATOR_DOT_SIZE = 3

function SeparatorDot(): JSX.Element {
  return (
    <Flex
      width={SEPARATOR_DOT_SIZE}
      height={SEPARATOR_DOT_SIZE}
      borderRadius="$roundedFull"
      backgroundColor="$neutral2"
    />
  )
}

function PoolOptionItemInner({
  token0CurrencyInfo,
  token1CurrencyInfo,
  poolId,
  chainId,
  onPress,
  protocolVersion,
  hookAddress,
  feeTier,
  focusedRowControl,
  searchStats,
  modifierPressHref,
  onModifierPress,
}: PoolOptionItemProps): JSX.Element {
  const poolName = `${token0CurrencyInfo.currency.symbol}/${token1CurrencyInfo.currency.symbol}`
  const { versionLabel, feeLabel, hookLabel, hookMark } = usePoolIdentityLabels({
    chainId,
    protocolVersion,
    hookAddress,
    feeTier,
  })

  // Identity as dot-separated text ("v3 · 0.3% · hook") in place of the pool address, freeing the right edge for stats.
  const identitySubtitle = (
    <Flex row alignItems="center" gap="$spacing4">
      <Text color="$neutral2" numberOfLines={1} variant="body3">
        {versionLabel}
      </Text>
      <SeparatorDot />
      <Text color="$neutral2" numberOfLines={1} variant="body3">
        {feeLabel}
      </Text>
      {hookLabel ? (
        <>
          <SeparatorDot />
          <Flex row shrink alignItems="center" gap="$spacing2" testID={TestID.PoolOptionItemHookBadge}>
            {hookMark}
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {hookLabel}
            </Text>
          </Flex>
        </>
      ) : null}
    </Flex>
  )

  const statsElement = hasPoolSearchStats(searchStats) ? <PoolOptionItemStats {...searchStats} /> : undefined

  const optionItem = (
    <OptionItem
      image={
        <SplitLogo
          size={iconSizes.icon40}
          inputCurrencyInfo={token0CurrencyInfo}
          outputCurrencyInfo={token1CurrencyInfo}
          chainId={chainId}
        />
      }
      title={poolName}
      subtitle={identitySubtitle}
      focusedRowControl={focusedRowControl}
      rightElement={statsElement}
      modifierPressHref={modifierPressHref}
      onPress={onPress}
      onModifierPress={onModifierPress}
    />
  )
  const { value: isContextMenuOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)

  return (
    <PoolOptionItemContextMenu
      actions={[PoolContextMenuAction.CopyAddress, PoolContextMenuAction.Share]}
      isOpen={isContextMenuOpen}
      closeMenu={closeContextMenu}
      openMenu={openContextMenu}
      poolId={poolId}
      chainId={chainId}
      protocolVersion={protocolVersion}
    >
      {optionItem}
    </PoolOptionItemContextMenu>
  )
}

export const PoolOptionItem = memo(PoolOptionItemInner)
