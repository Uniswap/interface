import { Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { FadeInAnimation } from 'components/Animation'
import CurrencyLogo from 'components/CurrencyLogo'
import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import useMarquee from 'hooks/useMarquee'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useActiveAndUniqueFarmsData } from 'state/farms/classic/hooks'
import { useElasticFarms } from 'state/farms/elastic/hooks'

const StyledLink = styled(Link)`
  display: flex;
  gap: 4px;
  align-items: center;
  padding-right: 12px;
  background: ${({ theme }) => theme.buttonBlack};

  min-width: fit-content;
  color: ${({ theme }) => theme.subText};
  text-decoration: none;

  :not(:last-child) {
    border-right: 1px solid ${({ theme }) => theme.border};
  }
`

const MarqueeItem = ({ token0: address0, token1: address1 }: { token0: string; token1: string }) => {
  const { chainId, networkInfo } = useActiveWeb3React()

  const token0 = useToken(address0) as Token
  const currency0 =
    chainId && address0.toLowerCase() === WETH[chainId].address.toLowerCase() ? NativeCurrencies[chainId] : token0

  const token1 = useToken(address1) as Token
  const currency1 =
    chainId && address1.toLowerCase() === WETH[chainId].address.toLowerCase() ? NativeCurrencies[chainId] : token1

  const { tab = VERSION.ELASTIC } = useParsedQueryString<{
    tab: string
  }>()
  if (!token0 || !token1) return null

  const token0Address = currency0.isNative ? currency0.symbol : token0.address
  const token1Address = currency1.isNative ? currency1.symbol : token1.address

  return (
    <StyledLink to={`${APP_PATHS.POOLS}/${networkInfo.route}/${token0Address}/${token1Address}?tab=${tab}`}>
      <CurrencyLogo currency={currency0} size="16px" />
      <Text fontSize="12px">
        {currency0.symbol} - {currency1.symbol}
      </Text>
      <CurrencyLogo currency={currency1} size="16px" />
    </StyledLink>
  )
}

const FarmingPoolsMarquee = ({ tab }: { tab: string }) => {
  const { data: uniqueAndActiveFarms } = useActiveAndUniqueFarmsData()

  const { farms } = useElasticFarms()
  const theme = useTheme()

  const existedPairs: { [key: string]: boolean } = {}

  const activePrommFarm =
    farms
      ?.map(farm => farm.pools)
      .flat()
      .filter(item => item.endTime > +new Date() / 1000)
      .filter(item => {
        const key = item.token0.wrapped.address + '_' + item.token1.wrapped.address
        if (existedPairs[key]) return false
        existedPairs[key] = true
        return true
      }) || []

  const increaseRef = useMarquee(tab === VERSION.ELASTIC ? activePrommFarm : uniqueAndActiveFarms)

  if (tab === VERSION.CLASSIC && uniqueAndActiveFarms.length === 0) return null
  if (tab === VERSION.ELASTIC && activePrommFarm.length === 0) return null

  return (
    <FadeInAnimation>
      <Container>
        <Title>
          <MouseoverTooltip text="Available for yield farming">
            <MoneyBag size={16} color={theme.apr} />
          </MouseoverTooltip>

          <TitleText>
            <Trans>Farming Pools</Trans>
          </TitleText>
        </Title>
        <MarqueeSection>
          <MarqueeWrapper ref={increaseRef}>
            <Marquee>
              {tab === VERSION.CLASSIC
                ? uniqueAndActiveFarms.map(farm => (
                    <MarqueeItem
                      key={`${farm.token0?.symbol}-${farm.token1?.symbol}`}
                      token0={farm.token0.id}
                      token1={farm.token1.id}
                    />
                  ))
                : activePrommFarm.map(farm => (
                    <MarqueeItem
                      key={`${farm.token0.wrapped.address}-${farm.token1.wrapped.address}`}
                      token0={farm.token0.wrapped.address}
                      token1={farm.token1.wrapped.address}
                    />
                  ))}
            </Marquee>
          </MarqueeWrapper>
        </MarqueeSection>
      </Container>
    </FadeInAnimation>
  )
}

export default FarmingPoolsMarquee

const Container = styled.div`
  overflow: hidden;
  display: flex;
  gap: 16px;
  padding: 6px 6px 6px 12px;
  background: ${({ theme }) => theme.background};
  border-radius: 999px;
  align-items: center;
  position: relative;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    background: ${({ theme }) => theme.buttonBlack};
    padding: 0;
  `}
`

const Title = styled.div`
  font-size: 14px;
  min-width: max-content;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  gap: 4px;
`

const TitleText = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const MarqueeSection = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  overflow: hidden;
  z-index: 1;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 999px;
  padding: 6px 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 6px 0;
  `}
`

const MarqueeWrapper = styled.div`
  overflow: scroll;
  width: 100%;

  ::-webkit-scrollbar {
    display: none;
  }
`

const Marquee = styled.div`
  min-width: max-content;
  overflow: hidden;
  display: flex;
  gap: 12px;
`
