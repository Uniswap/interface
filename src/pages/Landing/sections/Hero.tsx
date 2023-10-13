import { Swap } from 'pages/Swap'
import styled from 'styled-components'

import { RiseIn, RiseInText } from '../components/Animate'
import { Box, H1, Subheading } from '../components/Generics'
import { TokenCloud } from '../components/TokenCloud'

export function Hero() {
  return (
    <>
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
    </>
  )
}

const LandingSwap = styled(Swap)`
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
