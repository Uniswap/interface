import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { ButtonGray, ButtonPrimary, ButtonText } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { SwapPoolTabs } from 'components/NavigationTabs'
import PositionList from 'components/PositionList'
import { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useV3Positions } from 'hooks/useV3Positions'
import { useContext } from 'react'
import { Activity, BookOpen, ChevronDown, ChevronsRight, Inbox, Layers, PlusCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { useToggleWalletModal } from 'state/application/hooks'
import { useUserHideClosedPositions } from 'state/user/hooks'
import styled, { css, ThemeContext } from 'styled-components/macro'
import { ExternalLink, HideSmall, ThemedText } from 'theme'
import { PositionDetails } from 'types/position'
import { isChainAllowed } from 'utils/switchChain'

import { V2_FACTORY_ADDRESSES } from '../../constants/addresses'
import CTACards from './CTACards'
import { LoadingRows } from './styleds'

const PageWrapper = styled(AutoColumn)`
  max-width: 870px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 500px;
  `};
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  `};
`
const ButtonRow = styled(RowFixed)`
  & > *:not(:last-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    flex-direction: row-reverse;
  `};
`
const Menu = styled(NewMenu)`
  margin-left: 0;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 49%;
    right: 0px;
  `};

  a {
    width: 100%;
  }
`
const MenuItem = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-weight: 500;
`
const MoreOptionsButton = styled(ButtonGray)`
  border-radius: 12px;
  flex: 1 1 auto;
  padding: 6px 8px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg0};
  margin-right: 8px;
`

const MoreOptionsText = styled(ThemedText.Body)`
  align-items: center;
  display: flex;
`

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const NetworkIcon = styled(Activity)`
  ${IconStyle}
`

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.bg0};
  padding: 8px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
`

function PositionsLoadingPlaceholder() {
  return (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </LoadingRows>
  )
}

function WrongNetworkCard() {
  const theme = useContext(ThemeContext)
  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active="pool" />
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <ThemedText.Body fontSize={'20px'}>
                <Trans>Pools Overview</Trans>
              </ThemedText.Body>
            </TitleRow>

            <MainContentWrapper>
              <ErrorContainer>
                <ThemedText.Body color={theme.text3} textAlign="center">
                  <NetworkIcon strokeWidth={1.2} />
                  <div data-testid="pools-unsupported-err">
                    <Trans>
                      Your connected network is unsupported. Request support{' '}
                      <ExternalLink href="https://uniswap.canny.io/feature-requests">here</ExternalLink>.
                    </Trans>
                  </div>
                </ThemedText.Body>
              </ErrorContainer>
            </MainContentWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default function Pool() {
  const { account, chainId, connector } = useWeb3React()
  const toggleWalletModal = useToggleWalletModal()

  const theme = useContext(ThemeContext)
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()

  const { positions, loading: positionsLoading } = useV3Positions(account)

  if (chainId && !isChainAllowed(connector, chainId)) {
    return <WrongNetworkCard />
  }

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const filteredPositions = [...openPositions, ...(userHideClosedPositions ? [] : closedPositions)]
  const showConnectAWallet = Boolean(!account)
  const showV2Features = Boolean(chainId && V2_FACTORY_ADDRESSES[chainId])

  const menuItems = [
    {
      content: (
        <MenuItem>
          <Trans>Create a pool</Trans>
          <PlusCircle size={16} />
        </MenuItem>
      ),
      link: '/add/ETH',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Trans>Migrate</Trans>
          <ChevronsRight size={16} />
        </MenuItem>
      ),
      link: '/migrate/v2',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Trans>V2 liquidity</Trans>
          <Layers size={16} />
        </MenuItem>
      ),
      link: '/pool/v2',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Trans>Learn</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: 'https://docs.uniswap.org/',
      external: true,
    },
  ]

  return (
    <Trace page={PageName.POOL_PAGE} shouldLogImpression>
      <>
        <PageWrapper>
          <SwapPoolTabs active="pool" />
          <AutoColumn gap="lg" justify="center">
            <AutoColumn gap="lg" style={{ width: '100%' }}>
              <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
                <ThemedText.Body fontSize={'20px'}>
                  <Trans>Pools Overview</Trans>
                </ThemedText.Body>
                <ButtonRow>
                  {showV2Features && (
                    <Menu
                      menuItems={menuItems}
                      flyoutAlignment={FlyoutAlignment.LEFT}
                      ToggleUI={(props: any) => (
                        <MoreOptionsButton {...props}>
                          <MoreOptionsText>
                            <Trans>More</Trans>
                            <ChevronDown size={15} />
                          </MoreOptionsText>
                        </MoreOptionsButton>
                      )}
                    />
                  )}
                  <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/ETH">
                    + <Trans>New Position</Trans>
                  </ResponsiveButtonPrimary>
                </ButtonRow>
              </TitleRow>

              <MainContentWrapper>
                {positionsLoading ? (
                  <PositionsLoadingPlaceholder />
                ) : filteredPositions && closedPositions && filteredPositions.length > 0 ? (
                  <PositionList
                    positions={filteredPositions}
                    setUserHideClosedPositions={setUserHideClosedPositions}
                    userHideClosedPositions={userHideClosedPositions}
                  />
                ) : (
                  <ErrorContainer>
                    <ThemedText.Body color={theme.text3} textAlign="center">
                      <InboxIcon strokeWidth={1} />
                      <div>
                        <Trans>Your active V3 liquidity positions will appear here.</Trans>
                      </div>
                    </ThemedText.Body>
                    {!showConnectAWallet && closedPositions.length > 0 && (
                      <ButtonText
                        style={{ marginTop: '.5rem' }}
                        onClick={() => setUserHideClosedPositions(!userHideClosedPositions)}
                      >
                        <Trans>Show closed positions</Trans>
                      </ButtonText>
                    )}
                    {showConnectAWallet && (
                      <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                        <Trans>Connect a wallet</Trans>
                      </ButtonPrimary>
                    )}
                  </ErrorContainer>
                )}
              </MainContentWrapper>
              <HideSmall>
                <CTACards />
              </HideSmall>
            </AutoColumn>
          </AutoColumn>
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
