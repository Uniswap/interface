import { memo } from 'react'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import Badge from 'uniswap/src/components/badge/Badge'
import { OptionItem } from 'uniswap/src/components/lists/items/OptionItem'
import { PoolOptionItemContextMenu } from 'uniswap/src/components/lists/items/pools/PoolOptionItemContextMenu'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { shortenAddress } from 'utilities/src/addresses'

interface PoolOptionItemProps {
  token0CurrencyInfo: CurrencyInfo
  token1CurrencyInfo: CurrencyInfo
  poolId: string
  chainId: UniverseChainId
  onPress: () => void
  protocolVersion: ProtocolVersion
  hookAddress?: string
  feeTier: number
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
        protocolVersion !== ProtocolVersion.V4 ? (
          <Text color="$neutral3" numberOfLines={1} variant="body3">
            {shortenAddress(poolId)}
          </Text>
        ) : undefined
      }
      badge={
        <Flex row gap="$spacing2" alignItems="center">
          <Badge size="small" placement="start">
            {protocolVersion.toLowerCase()}
          </Badge>
          {hookAddress && (
            <Badge size="small" placement="middle">
              {shortenAddress(hookAddress, 4)}
            </Badge>
          )}
          <Badge size="small" placement="end">
            {feeTier / BIPS_BASE}%
          </Badge>
        </Flex>
      }
      onPress={onPress}
    />
  )

  return <PoolOptionItemContextMenu poolInfo={{ poolId, chain: chainId }}>{optionItem}</PoolOptionItemContextMenu>
}

export const PoolOptionItem = memo(_PoolOptionItem)
