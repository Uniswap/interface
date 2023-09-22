import { Swap } from 'pages/Swap'
import { memo } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { Hover, RiseIn, RiseInText } from './components/Animate'
import { Body1, Body2, Box, Button, Container, H1, H2, Subheading } from './components/Generics'
import { PoissonHero as Hero } from './components/PoissonHero'
import StatCard from './components/StatCard'
import ValuePropCard from './components/ValuePropCard'

function Landing() {
  const isDarkMode = useIsDarkMode()
  // const cardsRef = useRef<HTMLDivElement>(null)
  // const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  // const shouldDisableNFTRoutes = useDisableNFTRoutes()
  // const cards = useMemo(
  //   () => MAIN_CARDS.filter((card) => !(shouldDisableNFTRoutes && card.to.startsWith('/nft'))),
  //   [shouldDisableNFTRoutes]
  // )

  // const [accountDrawerOpen] = useAccountDrawer()
  // const navigate = useNavigate()
  // useEffect(() => {
  //   if (accountDrawerOpen) {
  //     setTimeout(() => {
  //       navigate('/swap')
  //     }, TRANSITION_DURATIONS.fast)
  //   }
  // }, [accountDrawerOpen, navigate])

  // const location = useLocation()
  // const queryParams = parse(location.search, { ignoreQueryPrefix: true })
  // if (selectedWallet && !queryParams.intro) {
  //   return <Navigate to={{ ...location, pathname: '/swap' }} replace />
  // }

  return (
    <Container>
      <Box direction="column" height="800px" align="center" justify="flex-start">
        <Hero />
        <Box direction="column" align="center" style={{ pointerEvents: 'none' }}>
          <Box direction="column" gap="20px" maxWidth="430px" align="center" padding="48px 0">
            <Box direction="column" align="center">
              <H1>
                <RiseInText delay={1.0}>Swap</RiseInText> <RiseInText delay={1.1}>anytime,</RiseInText>
              </H1>
              <RiseIn delay={1.3}>
                <H1>Anywhere</H1>
              </RiseIn>
            </Box>
            <RiseIn delay={1.5}>
              <Subheading>
                The largest marketplace for onchain digital assets. Swap on Ethereum and 7+ additional chains.
              </Subheading>
            </RiseIn>
          </Box>
          <RiseIn delay={1.7}>
            <LandingSwap />
          </RiseIn>
        </Box>

        <Box position="absolute" bottom="48px" width="100%" align="center" justify="center" pointerEvents="none">
          <RiseIn delay={2.3}>
            <Box direction="column" align="center" justify="flex-start">
              <Body2>Scroll to Learn More</Body2>
              <Hover>
                <ChevronDown />
              </Hover>
            </Box>
          </RiseIn>
        </Box>
      </Box>
      <Box direction="column" align="center" padding="100px 24px">
        {/* Go direct to Defi */}
        <Box direction="column" gap="108px" maxWidth="1328px">
          <H2>Go direct to DeFi</H2>
          <Box direction="row" gap="24px">
            <Box direction="column" gap="24px">
              <ValuePropCard
                tagText="Web app"
                titleText={`Swapping made simple.\nAccess thousands of tokens on 7+ chains.`}
                height="696px"
                isDarkMode={isDarkMode}
                textColor="#627EEA"
                backgroundColor={{ dark: 'rgba(98, 126, 234, 0.20)', light: 'rgba(98, 126, 234, 0.10)' }}
              />
              <ValuePropCard
                tagText="Documentation"
                titleText={`Build open apps and\ntools that you want to\nsee in the world.`}
                height="320px"
                isDarkMode={isDarkMode}
                textColor="#1DA16A"
                backgroundColor={{ dark: 'rgba(22, 222, 139, 0.12)', light: 'rgba(22, 222, 139, 0.06)' }}
              />
            </Box>
            <Box direction="column" gap="24px">
              <ValuePropCard
                tagText="Provide Liquidity"
                titleText={`Provide liquidity to pools\non the Uniswap protocol\nand earn fees on swaps.`}
                height="320px"
                isDarkMode={isDarkMode}
                textColor="#A457FF"
                backgroundColor={{ dark: 'rgba(164, 87, 255, 0.15)', light: 'rgba(164, 87, 255, 0.15)' }}
              />
              <ValuePropCard
                tagText="Download the wallet"
                titleText={`The power of Uniswap in your\npocket`}
                height="696px"
                isDarkMode={isDarkMode}
                textColor="#FC72FF"
                backgroundColor={{ dark: 'rgba(252, 114, 255, 0.12)', light: 'rgba(252, 114, 255, 0.12)' }}
              />
            </Box>
          </Box>
        </Box>
        <Box direction="column" align="center" padding="100px 24px">
          <Box direction="row" maxWidth="1328px" height="624px" gap="24px">
            <Box direction="column" justify-content="space-between" height="100%">
              <H2>Trusted by millions</H2>
              <Box bottom="0" position="absolute" direction="column" maxWidth="480px" gap="24px">
                <Body1>
                  The Uniswap platform is powered by the Uniswap protocol. The largest, most trusted decentralized
                  crypto exchange on Ethereum. Uniswap is available on 7+ additional EVM compatible chains and governed
                  by a global community.
                </Body1>
                <Button as="a">Learn more</Button>
              </Box>
            </Box>
            <Box direction="column" gap="16px" height="100%">
              <Box gap="16px" height="100%">
                <StatCard title="Lifetime volume" value="$0T" />
                <StatCard title="Assets" value="0" />
              </Box>
              <Box gap="16px" height="100%">
                <StatCard title="Lifetime swappers" value="0M" />
                <StatCard title="Trades today" value="3,456" />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}

export default memo(Landing)

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
