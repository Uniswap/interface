import { Trans } from '@lingui/macro'
import { ColumnCenter } from 'components/Column'
import { useCurrency } from 'hooks/Tokens'
import { Swap } from 'pages/Swap'
import { useEffect, useState } from 'react'
import React from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { Hover, RiseIn, RiseInText } from '../components/animations'
import { Box, H1, Subheading } from '../components/Generics'
import { TokenCloud } from '../components/TokenCloud/index'

const LandingSwapContainer = styled(Box)`
  width: 464px;
  padding: 0px 16px;
  @media (max-width: 768px) {
    max-width: 464px;
    width: 100%;
  }
`
const LandingSwap = styled(Swap)`
  position: relative;
  width: 100%;

  & > div:first-child > div:first-child {
    display: none;
  }
`
const StyledH1 = styled(H1)`
  @media (max-width: 768px) {
    font-size: 52px;
  }
  @media (max-width: 464px) {
    font-size: 36px;
  }
`

interface HeroProps {
  scrollToRef: () => void
}

export function Hero({ scrollToRef }: HeroProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const handleScroll = () => {
    const position = window.scrollY
    setScrollPosition(position)
  }
  const initialInputCurrency = useCurrency('ETH')

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const translateY = -scrollPosition / 7
  const opacityY = 1 - scrollPosition / 1000

  return (
    <Box
      position="relative"
      height="900px"
      style={{ minWidth: '100vw', paddingTop: 100, transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
    >
      <TokenCloud />
      <Box
        direction="column"
        align="center"
        style={{ pointerEvents: 'none', transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
      >
        <Box direction="column" gap="20px" maxWidth="430px" align="center" padding="48px 0">
          <Box direction="column" align="center">
            <StyledH1>
              <RiseInText delay={0.0}>
                <Trans>Swap</Trans>
              </RiseInText>{' '}
              <RiseInText delay={0.1}>
                <Trans>anytime,</Trans>
              </RiseInText>
            </StyledH1>
            <RiseIn delay={0.2}>
              <StyledH1>
                <Trans>anywhere.</Trans>
              </StyledH1>
            </RiseIn>
          </Box>

          <RiseIn delay={0.4}>
            <LandingSwapContainer>
              <LandingSwap initialInputCurrency={initialInputCurrency} />
            </LandingSwapContainer>
          </RiseIn>

          <RiseIn delay={0.3}>
            <Subheading>
              <Trans>The largest onchain marketplace. Buy and sell crypto on Ethereum and 7+ other chains.</Trans>
            </Subheading>
          </RiseIn>
        </Box>
      </Box>
      <Box
        position="absolute"
        bottom="48px"
        width="100%"
        align="center"
        justify="center"
        pointerEvents="none"
        style={{ transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
      >
        <RiseIn delay={0.3}>
          <Box
            direction="column"
            align="center"
            justify="flex-start"
            onClick={() => scrollToRef()}
            style={{ cursor: 'pointer' }}
            width="500px"
          >
            <Hover>
              <ColumnCenter>
                <ThemedText.BodySecondary>
                  <Trans>Scroll to Learn More</Trans>
                </ThemedText.BodySecondary>
                <ChevronDown />
              </ColumnCenter>
            </Hover>
          </Box>
        </RiseIn>
      </Box>
    </Box>
  )
}
