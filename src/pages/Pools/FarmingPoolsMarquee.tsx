import React, { useEffect, useRef } from 'react'
import { Trans } from '@lingui/macro'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { ChainId, Token, WETH } from '@dynamic-amm/sdk'
import { Text } from 'rebass'
import CurrencyLogo from 'components/CurrencyLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import DropIcon from 'components/Icons/DropIcon'
import { Link } from 'react-router-dom'
import { useActiveWeb3React } from 'hooks'
import { useActiveAndUniqueFarmsData } from 'state/farms/hooks'
import { useDeepCompareEffect } from 'react-use'
import { setFarmsData } from 'state/farms/actions'
import { useAppDispatch } from 'state/hooks'

const MarqueeItem = ({ token0, token1 }: { token0: Token; token1: Token }) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()

  const token0Address =
    token0.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? WETH[chainId as ChainId].symbol?.slice(1)
      : token0.address
  const token1Address =
    token1.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? WETH[chainId as ChainId].symbol?.slice(1)
      : token1.address

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
      to={`/pools/${token0Address}/${token1Address}`}
    >
      <CurrencyLogo currency={token0} size="16px" />
      <Text fontSize="12px">{token0.symbol}</Text>
      <Text fontSize="12px">|</Text>
      <Text fontSize="12px">{token1.symbol ?? '--'}</Text>
      <CurrencyLogo currency={token1} size="16px" />
    </Link>
  )
}

const FarmingPoolsMarquee = () => {
  const { data: uniqueAndActiveFarms } = useActiveAndUniqueFarmsData()

  const increaseRef = useRef<HTMLDivElement>(null)

  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  useEffect(() => {
    dispatch(setFarmsData({}))
  }, [dispatch, chainId])

  useDeepCompareEffect(() => {
    let itv: NodeJS.Timeout | undefined
    if (increaseRef && increaseRef.current) {
      itv = setInterval(() => {
        if (increaseRef.current && increaseRef.current.scrollLeft !== increaseRef.current.scrollWidth) {
          increaseRef.current.scrollTo({
            left: increaseRef.current.scrollLeft + 1,
          })
        }
      }, 50)
    }

    return () => {
      itv && clearInterval(itv)
    }
  }, [uniqueAndActiveFarms])

  if (uniqueAndActiveFarms.length === 0) return null

  return (
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
            {uniqueAndActiveFarms.map(farm => (
              <MarqueeItem
                key={`${farm.token0?.symbol}-${farm.token1?.symbol}`}
                token0={{ ...farm.token0, address: farm.token0.id }}
                token1={{ ...farm.token1, address: farm.token1.id }}
              />
            ))}
          </Marquee>
        </MarqueeWrapper>
      </MarqueeSection>
    </Container>
  )
}

export default FarmingPoolsMarquee

const Container = styled.div`
  @keyframes fadeInOpacity {
    0% {
      opacity: 0;
      transform: translateY(-10%);
    }
    100% {
      opacity: 1;
      transform: translateY(0%);
    }
  }
  overflow: hidden;
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  background: ${({ theme }) => theme.bg6};
  border-radius: 5px;
  align-items: center;
  position: relative;
  margin-bottom: 24px;
  animation-name: fadeInOpacity;
  animation-iteration-count: 1;
  animation-timing-function: ease-in;
  animation-duration: 1s;

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
