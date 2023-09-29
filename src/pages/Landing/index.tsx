import { Swap } from 'pages/Swap'
import { memo } from 'react'
import { ChevronDown } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { Hover, RiseIn, RiseInText } from './components/Animate'
import { DocumentationCard } from './components/cards/DocumentationCard'
import { DownloadWalletCard } from './components/cards/DownloadWalletCard'
import { GenericCard } from './components/cards/GenericCard'
import { LiquidityCard } from './components/cards/LiquidityCard'
import { PillButton } from './components/cards/PillButton'
import { WebappCard } from './components/cards/WebappCard'
import { Body1, Body2, Box, Button, Container, H1, H2, H3, Subheading } from './components/Generics'
import { Hero } from './components/hero/Hero'
import { ArrowRightCircle, BookOpen, Discord, File, Github, HelpCircle, Instagram, Twitter } from './components/Icons'
import StatCard from './components/StatCard'

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

  const theme = useTheme()

  return (
    <Container>
      <Box direction="column" height="800px" align="center" justify="flex-start">
        <Hero />
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
          <RiseIn delay={0.5}>
            <Box direction="column" align="center" justify="flex-start">
              <Body2>Scroll to Learn More</Body2>
              <Hover>
                <ChevronDown />
              </Hover>
            </Box>
          </RiseIn>
        </Box>
      </Box>

      <Box direction="column" align="center" padding="0 24px">
        {/* Go direct to Defi */}
        <Box direction="column" gap="108px" maxWidth="1328px">
          <H2>Go direct to DeFi</H2>
          <Box direction="row" gap="24px">
            <Box direction="column" gap="24px">
              <WebappCard />
              <DocumentationCard />
            </Box>
            <Box direction="column" gap="24px">
              <LiquidityCard />
              <DownloadWalletCard />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box direction="column" align="center" padding="0 24px">
        <Box direction="row" maxWidth="1328px" height="624px" gap="24px">
          <Box direction="column" justify-content="space-between" height="100%">
            <H2>Trusted by millions</H2>
            <Box bottom="0" position="absolute" direction="column" maxWidth="480px" gap="24px">
              <Body1>
                The Uniswap platform is powered by the Uniswap protocol. The largest, most trusted decentralized crypto
                exchange on Ethereum. Uniswap is available on 7+ additional EVM compatible chains and governed by a
                global community.
              </Body1>
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
        </Box>
      </Box>

      <Box direction="column" align="center" padding="0 24px">
        <Box direction="row" maxWidth="1328px" height="624px" gap="24px">
          <Box direction="column" justify-content="space-between" height="100%" gap="108px">
            <H2>Tktkt</H2>
            <Box gap="24px" width="100%" maxWidth="1328px">
              <GenericCard
                aspectRatio="1/1"
                width="25%"
                height="100%"
                backgroundColor={theme.surface2}
                topSlot={
                  <PillButton icon={<HelpCircle fill={theme.neutral1} />} color={theme.neutral1} label="Help Center" />
                }
                bottomSlot={<H3>Get support</H3>}
              />
              <GenericCard
                aspectRatio="1/1"
                width="25%"
                height="100%"
                backgroundColor={theme.surface2}
                topSlot={<PillButton icon={<BookOpen fill={theme.neutral1} />} color={theme.neutral1} label="Blog" />}
                bottomSlot={<H3>Insights and updates from the team</H3>}
              />
              <GenericCard
                aspectRatio="2/1"
                width="50%"
                backgroundColor={theme.neutral1}
                height="100%"
                topSlot={<PillButton icon={<File fill={theme.neutral1} />} color={theme.neutral1} label="Newsletter" />}
                bottomSlot={<H3 color={theme.surface2}>enter email address</H3>}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box as="footer" direction="column" align="center" padding="0 24px">
        <Box direction="row" maxWidth="1328px" gap="24px">
          <Box direction="row" justify-content="space-between">
            <Box direction="column" height="100%" gap="64px">
              <Box direction="column" gap="10px">
                <Body1>© 2023</Body1>
                <Body1>Uniswap Labs</Body1>
              </Box>
              <Box gap="24px">
                <Box as="a" href="" flex="0">
                  <Github />
                </Box>
                <Box as="a" href="" flex="0">
                  <Twitter />
                </Box>
                <Box as="a" href="" flex="0">
                  <Discord />
                </Box>
                <Box as="a" href="" flex="0">
                  <Instagram />
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
