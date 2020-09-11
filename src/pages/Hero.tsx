import React, { FC } from 'react'
import { Switch, Route } from 'react-router-dom'
import CRODefiSwap from '../assets/images/cro-defi-swap.svg'
import styled from 'styled-components'
import { Text } from 'rebass'

const HeroWrapper = styled.div`
  position: relative;
  max-width: 420px;
  width: 100%;
  height: auto;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
  margin: 25px 0;
  gap: 9px;
`

const HeroText = styled(Text)`
  color: ${({ theme }) => theme.text1};
`

const DefaultHero: FC = () => (
  <HeroWrapper>
    <CRODefiSwap />
    <HeroText fontSize={16} fontWeight={600}>
      The Best Place to Swap & Farm DeFi Coins
    </HeroText>
  </HeroWrapper>
)

const Hero: FC = () => (
  <Switch>
    <Route component={DefaultHero} />
  </Switch>
)

export default Hero
