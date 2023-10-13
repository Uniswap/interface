import { useScroll } from 'framer-motion'
import { Swap } from 'pages/Swap'
import { useRef } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

import { Hover, RiseIn, RiseInText } from '../components/Animate'
import { Body2, Box, H1, Subheading } from '../components/Generics'
import { TokenCloud } from '../components/TokenCloud'

export function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ container: ref })

  console.log(scrollYProgress)

  return (
    <Box ref={ref} position="relative" height="800px">
      <TokenCloud />
      <Box direction="column" align="center" style={{ pointerEvents: 'none' }}>
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
          <LandingSwap />
        </RiseIn>
      </Box>
      <Box position="absolute" bottom="48px" width="100%" align="center" justify="center" pointerEvents="none">
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

const LandingSwap = styled(Swap)`
  position: relative;
  z-index: 9999;
  width: 464px;
  padding: 0 0 0 0;
  border: 0;
  background-color: transparent;
  box-shadow: none;
  border-radius: 0;

  &:hover {
    box-shadow: none;
    border: 0;
  }

  & > div:first-child {
    display: none;
  }

  & > div:nth-child(2) > div:first-child {
    background-color: ${({ theme }) => theme.surface1};
  }

  & > div:nth-child(3) > div:first-child > div:first-child {
    background-color: ${({ theme }) => theme.surface1};
  }
`
