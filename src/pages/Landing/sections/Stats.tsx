import styled, { useTheme } from 'styled-components'

import { Body1, Box, Button, H2 } from '../components/Generics'
import { ArrowRightCircle } from '../components/Icons'
import { StatCard } from '../components/StatCard'

const copy = `The Uniswap platform is powered by the Uniswap protocol. The largest, most trusted decentralized crypto
          exchange on Ethereum. Uniswap is available on 7+ additional EVM compatible chains and governed by a global
          community.`

export function Stats() {
  const theme = useTheme()
  return (
    <Box direction="column" align="center" padding="0 24px">
      <HideWhenSmall direction="row" maxWidth="1328px" height="624px" gap="24px">
        <Box direction="column" justify-content="space-between" height="100%">
          <H2>Trusted by millions</H2>
          <Box bottom="0" position="absolute" direction="column" maxWidth="480px" gap="24px">
            <Body1>{copy}</Body1>
            <Button as="a">
              Learn more <ArrowRightCircle size="24px" fill={theme.neutral1} />
            </Button>
          </Box>
        </Box>
        <Box direction="column" gap="16px" height="100%">
          <Box gap="16px" height="100%">
            <StatCard title="Lifetime volume" value="$1.6T" delay={0} />
            <StatCard title="Assets" value="81,036" delay={0.2} />
          </Box>
          <Box gap="16px" height="100%">
            <StatCard title="Lifetime swappers" value="38M" delay={0.4} />
            <StatCard title="Trades today" value="3,461" delay={0.6} />
          </Box>
        </Box>
      </HideWhenSmall>
      <HideWhenLarge maxWidth="1328px" direction="column" gap="32px">
        <H2>Trusted by millions</H2>
        <Box direction="column" gap="16px" height="100%">
          <Box gap="16px" height="100%">
            <StatCard title="Lifetime volume" value="$1.6T" delay={0} />
            <StatCard title="Assets" value="81,036" delay={0.2} />
          </Box>
          <Box gap="16px" height="100%">
            <StatCard title="Lifetime swappers" value="38M" delay={0.4} />
            <StatCard title="Trades today" value="3,461" delay={0.6} />
          </Box>
        </Box>
        <Body1>{copy}</Body1>
        <Button as="a">
          Learn more <ArrowRightCircle size="24px" fill={theme.neutral1} />
        </Button>
      </HideWhenLarge>
    </Box>
  )
}

const HideWhenSmall = styled(Box)`
  @media (max-width: 768px) {
    display: none;
  }
`
const HideWhenLarge = styled(Box)`
  @media (min-width: 768px) {
    display: none;
  }
`
