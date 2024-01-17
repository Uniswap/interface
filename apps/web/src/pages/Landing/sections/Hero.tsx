import { Trans } from '@lingui/macro'
import { useCurrency } from 'hooks/Tokens'
import { Swap } from 'pages/Swap'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

import { Hover, RiseIn, RiseInText } from '../components/animations'
import { Body2, Box, ExtendedH1, H1, Subheading } from '../components/Generics'
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
export function Hero() {
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

  const translateY = -scrollPosition / 3.5
  const opacityY = 1 - scrollPosition / 800

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
            <H1>
              <RiseInText delay={0.0}>
                <Trans>Swap</Trans>
              </RiseInText>{' '}
              <RiseInText delay={0.1}>
                <Trans>anytime,</Trans>
              </RiseInText>
            </H1>
            <RiseIn delay={0.2}>
              <ExtendedH1>
                <Trans>Anywhere</Trans>
              </ExtendedH1>
            </RiseIn>
          </Box>
          <RiseIn delay={0.3}>
            <Subheading>
              <Trans>
                The largest marketplace for onchain digital assets. Swap on Ethereum and 7+ additional chains.
              </Trans>
            </Subheading>
          </RiseIn>
        </Box>

        <RiseIn delay={0.4}>
          <LandingSwapContainer>
            <LandingSwap initialInputCurrency={initialInputCurrency} />
          </LandingSwapContainer>
        </RiseIn>
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
          <Box direction="column" align="center" justify="flex-start">
            <Body2>
              <Trans>Scroll to Learn More</Trans>
            </Body2>
            <Hover>
              <ChevronDown />
            </Hover>
          </Box>
        </RiseIn>
      </Box>
    </Box>
  )
}
