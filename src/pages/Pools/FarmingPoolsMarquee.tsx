import React, { useEffect } from 'react'
import { Trans } from '@lingui/macro'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Text } from 'rebass'
import CurrencyLogo from 'components/CurrencyLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import DropIcon from 'components/Icons/DropIcon'
import { Link } from 'react-router-dom'
import { useActiveWeb3React } from 'hooks'
import { useActiveAndUniqueFarmsData } from 'state/farms/hooks'
import { setFarmsData } from 'state/farms/actions'
import { useAppDispatch } from 'state/hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useProMMFarmsFetchOnlyOne } from 'state/farms/promm/hooks'
import { useToken } from 'hooks/Tokens'
import useMarquee from 'hooks/useMarquee'
import { FadeInAnimation } from 'components/Animation'
import { VERSION } from 'constants/v2'

const MarqueeItem = ({ token0: address0, token1: address1 }: { token0: string; token1: string }) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()

  const token0 = useToken(address0) as Token
  const token1 = useToken(address1) as Token

  const qs = useParsedQueryString()
  if (!token0 || !token1) return null

  const token0Address =
    token0.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? WETH[chainId as ChainId].symbol?.slice(1)
      : token0.address

  const token1Address =
    token1.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? WETH[chainId as ChainId].symbol?.slice(1)
      : token1.address

  const tab = (qs.tab as string) || VERSION.ELASTIC

  return (
    <Link
      style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        padding: '8px',
        background: theme.buttonBlack,
        borderRadius: '5px',
        minWidth: 'fit-content',
        color: theme.text,
        textDecoration: 'none',
      }}
      to={`/pools/${token0Address}/${token1Address}?tab=${tab}`}
    >
      <CurrencyLogo currency={token0} size="16px" />
      <Text fontSize="12px">{token0.symbol}</Text>
      <Text fontSize="12px">|</Text>
      <Text fontSize="12px">{token1.symbol ?? '--'}</Text>
      <CurrencyLogo currency={token1} size="16px" />
    </Link>
  )
}

const FarmingPoolsMarquee = ({ tab }: { tab: string }) => {
  const { data: uniqueAndActiveFarms } = useActiveAndUniqueFarmsData()

  const farms = useProMMFarmsFetchOnlyOne()

  const existedPairs: { [key: string]: boolean } = {}
  const activePrommFarm = Object.values(farms)
    .flat()
    .filter(item => item.endTime > +new Date() / 1000)
    .filter(item => {
      const key = item.token0 + '_' + item.token1
      if (existedPairs[key]) return false
      existedPairs[key] = true
      return true
    })

  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  useEffect(() => {
    dispatch(setFarmsData({}))
  }, [dispatch, chainId])

  const increaseRef = useMarquee(uniqueAndActiveFarms)

  if (tab === VERSION.CLASSIC && uniqueAndActiveFarms.length === 0) return null
  if (tab === VERSION.ELASTIC && activePrommFarm.length === 0) return null

  return (
    <FadeInAnimation>
      <Container>
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
          <MouseoverTooltip text="Available for yield farming">
            <DropIcon />
          </MouseoverTooltip>
        </div>
        <Title>
          <Trans>Farming Pools</Trans>
        </Title>
        <MarqueeSection>
          <MarqueeWrapper ref={increaseRef} id="mq">
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
                    <MarqueeItem key={`${farm.token0}-${farm.token1}`} token0={farm.token0} token1={farm.token1} />
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
  padding: 16px 24px;
  background: ${({ theme }) => theme.bg6};
  border-radius: 5px;
  align-items: center;
  position: relative;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `}
`

const Title = styled.div`
  font-size: 16px;
  min-width: max-content;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`

const MarqueeSection = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  overflow: hidden;
  z-index: 1;
`

const MarqueeWrapper = styled.div`
  overflow: auto;
  width: 100%;

  ::-webkit-scrollbar {
    display: none;
  }
`

const Marquee = styled.div`
  min-width: fit-content;
  overflow: hidden;
  display: flex;
  gap: 8px;
`
