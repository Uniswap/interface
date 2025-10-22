import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { memo } from 'react'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import Badge from 'uniswap/src/components/badge/Badge'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { FocusedRowControl, OptionItem } from 'uniswap/src/components/lists/items/OptionItem'
import {
  PoolContextMenuAction,
  PoolOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/pools/PoolOptionItemContextMenu'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ellipseMiddle, shortenAddress } from 'utilities/src/addresses'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

interface PoolOptionItemProps {
  token0CurrencyInfo: CurrencyInfo
  token1CurrencyInfo: CurrencyInfo
  poolId: string
  chainId: UniverseChainId
  onPress: () => void
  protocolVersion: ProtocolVersion
  hookAddress?: string
  feeTier: number
  focusedRowControl?: FocusedRowControl
  rightElement?: JSX.Element
}

function _PoolOptionItem({
  token0CurrencyInfo,
  token1CurrencyInfo,
  poolId,
  chainId,
  onPress,
  protocolVersion,
  hookAddress,
  feeTier,
  focusedRowControl,
  rightElement,
}: PoolOptionItemProps): JSX.Element {
  const poolName = `${token0CurrencyInfo.currency.symbol}/${token1CurrencyInfo.currency.symbol}`

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
      subtitle={
        <Text color="$neutral2" numberOfLines={1} variant="body3">
          {protocolVersion !== ProtocolVersion.V4
            ? shortenAddress({ address: poolId })
            : ellipseMiddle({ str: poolId, charsStart: 6 })}
        </Text>
      }
      badge={
        <Flex row gap="$spacing2" alignItems="center">
          <Badge size="small" placement="start">
            {ProtocolVersion[protocolVersion].toLowerCase()}
          </Badge>
          {hookAddress && (
            <Badge size="small" placement="middle">
              {shortenAddress({ address: hookAddress, chars: 4 })}
            </Badge>
          )}
          <Badge size="small" placement="end">
            {feeTier / BIPS_BASE}%
          </Badge>
        </Flex>
      }
      focusedRowControl={focusedRowControl}
      rightElement={rightElement}
      onPress={onPress}
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

export const PoolOptionItem = memo(_PoolOptionItem)
