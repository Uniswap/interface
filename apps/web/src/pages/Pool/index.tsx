import { InterfaceElementName, InterfaceEventName, InterfacePageName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonGray, ButtonPrimary, ButtonText } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { FlyoutAlignment, Menu } from 'components/Menu'
import PositionList from 'components/PositionList'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useIsSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useFilterPossiblyMaliciousPositions } from 'hooks/useFilterPossiblyMaliciousPositions'
import { useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import { useV3Positions } from 'hooks/useV3Positions'
import { Trans } from 'i18n'
import styled, { css, useTheme } from 'lib/styled-components'
import CTACards from 'pages/Pool/CTACards'
import { PoolVersionMenu } from 'pages/Pool/shared'
import { LoadingRows } from 'pages/Pool/styled'
import { useMemo } from 'react'
import { AlertTriangle, BookOpen, ChevronDown, ChevronsRight, Inbox, Layers } from 'react-feather'
import { Link } from 'react-router-dom'
import { ApplicationModal } from 'state/application/reducer'
import { useUserHideClosedPositions } from 'state/user/hooks'
import { HideSmall, ThemedText } from 'theme/components'
import { PositionDetails } from 'types/position'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 870px;
  width: 100%;

  @media (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 800px;
    padding-top: 48px;
  }

  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-width: 500px;
    padding-top: 20px;
  }
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.neutral2};
  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  }
`
const ButtonRow = styled(RowFixed)`
  & > *:not(:last-child) {
    margin-left: 8px;
  }

  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
`
const PoolMenu = styled(Menu)`
  margin-left: 0;
  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex: 1 1 auto;
    width: 50%;
  }

  a {
    width: 100%;
  }
`
const PoolMenuItem = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-weight: 535;
`
const MoreOptionsButton = styled(ButtonGray)`
  border-radius: 12px;
  flex: 1 1 auto;
  padding: 6px 8px;
  width: 100%;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  margin-right: 8px;
`

const MoreOptionsText = styled(ThemedText.BodyPrimary)`
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

const NetworkIcon = styled(AlertTriangle)`
  ${IconStyle}
`

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 12px;
  font-size: 16px;
  padding: 6px 8px;
  width: fit-content;
  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex: 1 1 auto;
    width: 50%;
  }
`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  const theme = useTheme()

  return (
    <>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding="0">
              <ThemedText.H1Large>
                <Trans i18nKey="pool.positions" />
              </ThemedText.H1Large>
            </TitleRow>

            <MainContentWrapper>
              <ErrorContainer>
                <ThemedText.BodyPrimary color={theme.neutral3} textAlign="center">
                  <NetworkIcon strokeWidth={1.2} />
                  <div data-testid="pools-unsupported-err">
                    <Trans i18nKey="pool.connection.networkUnsupported" />
                  </div>
                </ThemedText.BodyPrimary>
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
  const account = useAccount()
  const isSupportedChain = useIsSupportedChainId(account.chainId)
  const networkSupportsV2 = useNetworkSupportsV2()
  const accountDrawer = useAccountDrawer()

  const theme = useTheme()
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()

  const { positions, loading: positionsLoading } = useV3Positions(account.address)

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []],
  ) ?? [[], []]

  const userSelectedPositionSet = useMemo(
    () => [...openPositions, ...(userHideClosedPositions ? [] : closedPositions)],
    [closedPositions, openPositions, userHideClosedPositions],
  )

  const filteredPositions = useFilterPossiblyMaliciousPositions(userSelectedPositionSet)

  if (!isSupportedChain) {
    return <WrongNetworkCard />
  }

  const showConnectAWallet = Boolean(!account)

  const menuItems = [
    {
      content: (
        <PoolMenuItem>
          <Trans i18nKey="common.migrate" />
          <ChevronsRight size={16} />
        </PoolMenuItem>
      ),
      link: '/migrate/v2',
      external: false,
    },
    {
      content: (
        <PoolMenuItem>
          <Trans i18nKey="pool.v2liquidity" />
          <Layers size={16} />
        </PoolMenuItem>
      ),
      link: '/pools/v2',
      external: false,
    },
    {
      content: (
        <PoolMenuItem>
          <Trans i18nKey="pool.learn" />
          <BookOpen size={16} />
        </PoolMenuItem>
      ),
      link: 'https://support.uniswap.org/hc/en-us/categories/8122334631437-Providing-Liquidity-',
      external: true,
    },
  ]

  return (
    <Trace logImpression page={InterfacePageName.POOL_PAGE}>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding="0">
              <Row gap="md" width="min-content">
                <ThemedText.LargeHeader>
                  <Trans i18nKey="pool.positions" />
                </ThemedText.LargeHeader>
                <PoolVersionMenu protocolVersion={ProtocolVersion.V3} />
              </Row>
              <ButtonRow>
                {networkSupportsV2 && (
                  <PoolMenu
                    modal={ApplicationModal.POOL_OVERVIEW_OPTIONS}
                    menuItems={menuItems}
                    flyoutAlignment={FlyoutAlignment.LEFT}
                    ToggleUI={(props: any) => (
                      <MoreOptionsButton {...props}>
                        <MoreOptionsText>
                          <Trans i18nKey="common.more" />
                          <ChevronDown size={15} />
                        </MoreOptionsText>
                      </MoreOptionsButton>
                    )}
                  />
                )}
                <ResponsiveButtonPrimary data-cy="join-pool-button" id="join-pool-button" as={Link} to="/add/ETH">
                  + <Trans i18nKey="pool.newPosition" />
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
                  <ThemedText.BodyPrimary color={theme.neutral3} textAlign="center">
                    <InboxIcon strokeWidth={1} style={{ marginTop: '2em' }} />
                    <div>
                      <Trans i18nKey="pool.activePositions.appear" />
                    </div>
                  </ThemedText.BodyPrimary>
                  {!showConnectAWallet && closedPositions.length > 0 && (
                    <ButtonText
                      style={{ marginTop: '.5rem' }}
                      onClick={() => setUserHideClosedPositions(!userHideClosedPositions)}
                    >
                      <Trans i18nKey="pool.showClosed" />
                    </ButtonText>
                  )}
                  {showConnectAWallet && (
                    <Trace
                      logPress
                      eventOnTrigger={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                      properties={{ received_swap_quote: false }}
                      element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                    >
                      <ButtonPrimary
                        style={{ marginTop: '2em', marginBottom: '2em', padding: '8px 16px' }}
                        onClick={accountDrawer.open}
                      >
                        <Trans i18nKey="common.connectAWallet.button" />
                      </ButtonPrimary>
                    </Trace>
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
    </Trace>
  )
}
