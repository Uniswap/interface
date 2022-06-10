import { useActiveWeb3React } from 'hooks'
import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { parseSubgraphPoolData, useCheckIsFarmingPool } from 'utils/dmm'
import { formattedNum, shortenAddress } from 'utils'
import { MouseoverTooltip } from 'components/Tooltip'
import DropIcon from 'components/Icons/DropIcon'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import { Trans } from '@lingui/macro'
import CopyHelper from 'components/Copy'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { Link } from 'react-router-dom'
import { currencyId } from 'utils/currencyId'
import { DMM_ANALYTICS_URL, SUBGRAPH_AMP_MULTIPLIER } from 'constants/index'
import React, { useState } from 'react'
import { ListItemProps } from 'components/PoolList/ListItem'
import { Flex, Text } from 'rebass'
import {
  ButtonGroupContainer,
  FooterContainer,
  HeaderAMPAndAddress,
  HeaderContainer,
  HeaderLogo,
  HeaderTitle,
  InformationContainer,
  Progress,
  StyledItemCard,
  TabContainer,
  TabItem,
  TokenRatioContainer,
  TokenRatioGrid,
  TokenRatioName,
  TokenRatioPercent,
} from 'components/PoolList/styled'
import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import CurrencyLogo from 'components/CurrencyLogo'
import { useMedia } from 'react-use'
import { ExternalLink } from 'theme'
import { useUserStakedBalance } from 'state/farms/hooks'
import TabInfoItems from 'components/PoolList/ItemCard/TabInfoItems'
import TabDetailsItems from 'components/PoolList/ItemCard/TabDetailsItems'
import TabYourLiquidityItems from 'components/PoolList/ItemCard/TabYourLiquidityItems'
import TabYourStakedItems from 'components/PoolList/ItemCard/TabYourStakedItems'
import JSBI from 'jsbi'
import { useSharedPoolIdManager } from 'state/pools/hooks'
import { Share2 } from 'react-feather'

const TAB = {
  INFO: 0,
  DETAILS: 1,
  YOUR_LIQUIDITY: 2,
  YOUR_STAKED: 3,
}

const ItemCard = ({ poolData, myLiquidity }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))

  const isFarmingPool = useCheckIsFarmingPool(poolData.id)

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(poolData.id, 3)
  const { currency0, currency1, reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(
    poolData,
    chainId as ChainId,
  )
  const realPercentToken0 =
    reserve0 && virtualReserve0 && reserve1 && virtualReserve1
      ? reserve0.asFraction
          .divide(virtualReserve0)
          .multiply('100')
          .divide(reserve0.divide(virtualReserve0).asFraction.add(reserve1.divide(virtualReserve1).asFraction))
      : new Fraction('50')
  const realPercentToken1 = new Fraction('100').subtract(realPercentToken0)
  const isWarning = realPercentToken0.lessThan('10') || realPercentToken1.lessThan('10')

  const percentToken0 = realPercentToken0.toSignificant(4)
  const percentToken1 = realPercentToken1.toSignificant(4)

  const theme = useTheme()
  const above1000 = useMedia('(min-width: 1000px)')
  const [activeTabIndex, setActiveTabIndex] = useState(above1000 ? TAB.DETAILS : TAB.INFO)

  const { userStakedBalance } = useUserStakedBalance(poolData)

  const isHaveLiquidity = myLiquidity && myLiquidity.liquidityTokenBalance !== '0'

  const [, setSharedPoolId] = useSharedPoolIdManager()

  return (
    <StyledItemCard>
      {isFarmingPool && (
        <div style={{ position: 'absolute', top: -3, left: -1 }}>
          <MouseoverTooltip text="Available for yield farming">
            <DropIcon width={48} height={48} />
          </MouseoverTooltip>
        </div>
      )}
      {isWarning && (
        <div style={{ position: 'absolute', top: -3, left: -1 }}>
          <MouseoverTooltip text="One token is close to 0% in the poolData ratio. Pool might go inactive">
            <WarningLeftIcon width={48} height={48} />
          </MouseoverTooltip>
        </div>
      )}
      {above1000 ? (
        <HeaderContainer>
          <HeaderTitle>
            {poolData.token0.symbol} - {poolData.token1.symbol}
          </HeaderTitle>
          <HeaderAMPAndAddress>
            <span>AMP = {formattedNum(amp.toSignificant(5))}</span>
            <span>|</span>
            <span>{shortenPoolAddress}</span>
            <CopyHelper toCopy={poolData.id} />
          </HeaderAMPAndAddress>
          <HeaderLogo>
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={40} />
          </HeaderLogo>
        </HeaderContainer>
      ) : (
        <Flex flexDirection="column" alignItems="center" style={{ gap: '4px' }}>
          <Flex style={{ gap: '4px' }}>
            <Text fontSize="16px" fontWeight={400} lineHeight="16px">
              {shortenPoolAddress}
            </Text>
            <CopyHelper toCopy={poolData.id} margin="0" />
          </Flex>
          <Text color={theme.subText} fontSize="12px" fontWeight={400} lineHeight="16px">
            AMP = {formattedNum(amp.toSignificant(5))}
          </Text>
        </Flex>
      )}
      <TokenRatioContainer>
        <Progress value={percentToken0} />
        <TokenRatioGrid>
          <CurrencyLogo currency={currency0} size="32px" />
          <Flex flexDirection="column">
            <TokenRatioName>{poolData.token0.symbol}</TokenRatioName>
            <TokenRatioPercent>{percentToken0}%</TokenRatioPercent>
          </Flex>
          <Flex flexDirection="column" alignItems="flex-end">
            <TokenRatioName>{poolData.token1.symbol}</TokenRatioName>
            <TokenRatioPercent>{percentToken1}%</TokenRatioPercent>
          </Flex>
          <CurrencyLogo currency={currency1} size="32px" />
        </TokenRatioGrid>
      </TokenRatioContainer>
      <TabContainer>
        {!above1000 && (
          <TabItem active={activeTabIndex === TAB.INFO} onClick={() => setActiveTabIndex(TAB.INFO)}>
            <Trans>Info</Trans>
          </TabItem>
        )}
        <TabItem active={activeTabIndex === TAB.DETAILS} onClick={() => setActiveTabIndex(TAB.DETAILS)}>
          <Trans>Details</Trans>
        </TabItem>
        <TabItem active={activeTabIndex === TAB.YOUR_LIQUIDITY} onClick={() => setActiveTabIndex(TAB.YOUR_LIQUIDITY)}>
          {above1000 ? <Trans>Your Liquidity</Trans> : <Trans>Liquidity</Trans>}
        </TabItem>
        {userStakedBalance.greaterThan('0') && (
          <TabItem active={activeTabIndex === TAB.YOUR_STAKED} onClick={() => setActiveTabIndex(TAB.YOUR_STAKED)}>
            {above1000 ? <Trans>Your Staked</Trans> : <Trans>Staked</Trans>}
          </TabItem>
        )}
      </TabContainer>
      <InformationContainer>
        {activeTabIndex === TAB.INFO && <TabInfoItems poolData={poolData} myLiquidity={myLiquidity} />}
        {activeTabIndex === TAB.DETAILS && <TabDetailsItems poolData={poolData} />}
        {activeTabIndex === TAB.YOUR_LIQUIDITY && (
          <TabYourLiquidityItems poolData={poolData} myLiquidity={myLiquidity} />
        )}
        {activeTabIndex === TAB.YOUR_STAKED && <TabYourStakedItems poolData={poolData} />}
      </InformationContainer>
      <ButtonGroupContainer>
        <ButtonPrimary
          as={Link}
          to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`}
          style={{
            padding: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Add Liquidity
        </ButtonPrimary>
        <ButtonOutlined
          as={Link}
          to={
            isHaveLiquidity
              ? `/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`
              : `/swap?inputCurrency=${currencyId(currency0, chainId)}&outputCurrency=${currencyId(currency1, chainId)}`
          }
          style={{
            padding: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {isHaveLiquidity ? <Trans>Remove Liquidity</Trans> : <Trans>Swap</Trans>}
        </ButtonOutlined>
      </ButtonGroupContainer>
      <Divider />
      <FooterContainer>
        <ExternalLink
          href={DMM_ANALYTICS_URL[chainId as ChainId] + '/pool/' + poolData.id}
          style={{ fontSize: '14px' }}
        >
          <Trans>Analytics ↗</Trans>
        </ExternalLink>
        <ButtonEmpty width="fit-content" fontSize="14px" padding="0" onClick={() => setSharedPoolId(poolData.id)}>
          <Trans>Share</Trans>
          <Share2 size={14} style={{ marginLeft: '6px' }} />
        </ButtonEmpty>
      </FooterContainer>
    </StyledItemCard>
  )
}

export default ItemCard
