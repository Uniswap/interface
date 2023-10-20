import { Swap } from 'pages/Swap'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

import { Hover, RiseIn, RiseInText } from '../components/Animate'
import { Body2, Box, H1, Subheading } from '../components/Generics'
import { TokenCloud } from '../components/TokenCloud'

export function Hero() {
  const [scrollPosition, setScrollPosition] = useState(0)
  const handleScroll = () => {
    const position = window.scrollY
    setScrollPosition(position)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const translateY = -scrollPosition / 3.5
  const opacityY = 1 - scrollPosition / 800

  return (
    <Box position="relative" height="800px" style={{ transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}>
      <TokenCloud />
      <Box
        direction="column"
        align="center"
        style={{ pointerEvents: 'none', transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
      >
        <Box direction="column" gap="20px" maxWidth="430px" align="center" padding="48px 0">
          <Box direction="column" align="center">
            <H1>
              <RiseInText delay={0.0}>Swap</RiseInText> <RiseInText delay={0.1}>anytime,</RiseInText>
            </H1>
            <RiseIn delay={0.2}>
              <H1>Anywhere</H1>
            </RiseIn>
          </Box>
          <RiseIn delay={0.3}>
            <Subheading>
              The largest marketplace for onchain digital assets. Swap on Ethereum and 7+ additional chains.
            </Subheading>
          </RiseIn>
        </Box>

        <RiseIn delay={0.4}>
          <LandingSwapContainer>
            <LandingSwap />
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
            <Body2>Scroll to Learn More</Body2>
            <Hover>
              <ChevronDown />
            </Hover>
          </Box>
        </RiseIn>
      </Box>
    </Box>
  )
}

const LandingSwapContainer = styled(Box)`
  width: 464px;
  padding: 0px 16px;
  @media (max-width: 768px) {
    width: 100%;
  }
`

const LandingSwap = styled(Swap)`
  position: relative;
  width: 100%;
  padding: 8px;

  & > div:first-child {
    display: none;
  }
`

// &:hover {
//   box-shadow: none;
//   border: 0;
// }

// & > div:nth-child(2) > div:first-child {
//   background-color: ${({ theme }) => theme.surface1};
//   box-shadow: 0px 8px 24px 0px rgba(252, 114, 255, 0.1);
// }

// & > div:nth-child(3) > div:first-child > div:first-child {
//   background-color: ${({ theme }) => theme.surface1};
//   box-shadow: 0px 8px 24px 0px rgba(252, 114, 255, 0.1);
// }

// & > div:nth-child(3) > div:nth-child(2) > button {
//   box-shadow: 0px 8px 24px 0px rgba(252, 114, 255, 0.1);
// }
