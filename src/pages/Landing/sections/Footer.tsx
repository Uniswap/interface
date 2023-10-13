import { useTheme } from 'styled-components'

import { Body1, Body2, Box, H3 } from '../components/Generics'
import { Discord, Github, Instagram, Twitter } from '../components/Icons'

export function Footer() {
  const theme = useTheme()
  return (
    <Box as="footer" direction="column" align="center" padding="0 24px">
      <Box direction="row" maxWidth="1328px" gap="24px">
        <Box direction="row" justify-content="space-between">
          <Box direction="column" height="100%" gap="64px">
            <Box direction="column" gap="10px">
              <H3>© 2023</H3>
              <H3>Uniswap Labs</H3>
            </Box>
            <Box gap="24px">
              <Box as="a" href="" flex="0">
                <Github fill={theme.neutral1} />
              </Box>
              <Box as="a" href="" flex="0">
                <Twitter fill={theme.neutral1} />
              </Box>
              <Box as="a" href="" flex="0">
                <Discord fill={theme.neutral1} />
              </Box>
              <Box as="a" href="" flex="0">
                <Instagram fill={theme.neutral1} />
              </Box>
            </Box>
          </Box>
          <Box direction="row" height="100%">
            <Box direction="column" gap="10px">
              <Body1>App</Body1>
              <Body2 as="a" href="">
                Swap
              </Body2>
              <Body2 as="a" href="">
                Tokens
              </Body2>
              <Body2 as="a" href="">
                NFTs
              </Body2>
              <Body2 as="a" href="">
                Pools
              </Body2>
            </Box>
            <Box direction="column" gap="10px">
              <Body1>Protocol</Body1>
              <Body2 as="a" href="">
                Community
              </Body2>
              <Body2 as="a" href="">
                Governance
              </Body2>
              <Body2 as="a" href="">
                Developers
              </Body2>
            </Box>
            <Box direction="column" gap="10px">
              <Body1>Company</Body1>
              <Body2 as="a" href="">
                Careers
              </Body2>
              <Body2 as="a" href="">
                Blog
              </Body2>
            </Box>
            <Box direction="column" gap="10px">
              <Body1>Need help?</Body1>
              <Body2 as="a" href="">
                Contact us
              </Body2>
              <Body2 as="a" href="">
                Help Center
              </Body2>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
