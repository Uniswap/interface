import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'

import DoubleCurrencyLogo from 'components/DoubleLogo'
import ItemCard from 'components/PoolList/ItemCard/index'
import { ListItemGroupProps } from 'components/PoolList/ListItem'
import { DashedDivider, ItemCardGroupContainer, TextShowMorePools } from 'components/PoolList/styled'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'
import { parseSubgraphPoolData } from 'utils/dmm'

const ItemCardGroup = ({
  sortedFilteredSubgraphPoolsObject,
  poolData,
  userLiquidityPositions,
  expandedPoolKey,
  setExpandedPoolKey,
}: ListItemGroupProps) => {
  const poolKey = poolData.token0.id + '-' + poolData.token1.id

  const isShowTwoPools = poolKey === expandedPoolKey

  const [isShowAllPools, setIsShowAllPools] = useState(false)

  const expandedPools = sortedFilteredSubgraphPoolsObject.get(poolKey) ?? []

  const renderPools = isShowTwoPools ? (isShowAllPools ? expandedPools : expandedPools.slice(0, 2)) : [poolData]

  const isDisableShowAllPools = expandedPools.length <= 1

  const onUpdateExpandedPoolKeyAndShowAllPools = () => {
    if (isDisableShowAllPools) return
    setExpandedPoolKey(prev => (prev === poolKey ? '' : poolKey))
    setIsShowAllPools(prev => !prev)
  }

  const { chainId } = useActiveWeb3React()

  const { currency0, currency1 } = parseSubgraphPoolData(poolData, chainId as ChainId)

  const theme = useTheme()

  return (
    <ItemCardGroupContainer>
      <Flex
        justifyContent="space-between"
        onClick={onUpdateExpandedPoolKeyAndShowAllPools}
        style={{ cursor: isDisableShowAllPools ? 'default' : 'pointer' }}
      >
        <Flex>
          <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
          <Text fontSize="20px" fontWeight={500} lineHeight="24px">
            {poolData.token0.symbol} - {poolData.token1.symbol}
          </Text>
        </Flex>

        <ButtonIcon disabled={isDisableShowAllPools}>
          <ChevronDown
            color={theme.subText}
            style={{ transition: 'transform 0.2s', transform: `rotate(${isShowAllPools ? '-180deg' : 0})` }}
          />
        </ButtonIcon>
      </Flex>
      {renderPools.map((poolData, index) => (
        <ItemCard
          key={poolData.id}
          poolData={poolData}
          myLiquidity={userLiquidityPositions[poolData.id]}
          isShowExpandedPools={isShowTwoPools}
          isFirstPoolInGroup={index === 0}
          isDisableShowTwoPools={isDisableShowAllPools}
        />
      ))}
      {isShowAllPools && (
        <TextShowMorePools disabled={isDisableShowAllPools} onClick={onUpdateExpandedPoolKeyAndShowAllPools}>
          <Trans>
            Show less {poolData.token0.symbol} - {poolData.token1.symbol} pools
          </Trans>
        </TextShowMorePools>
      )}
      <DashedDivider />
    </ItemCardGroupContainer>
  )
}

export default ItemCardGroup
