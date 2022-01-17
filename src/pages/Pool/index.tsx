import { Trans } from '@lingui/macro'
import { ButtonGray, ButtonPrimary, ButtonText } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { SwapPoolTabs } from 'components/NavigationTabs'
import PositionList from 'components/PositionList'
import { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useV3Positions } from 'hooks/useV3Positions'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext } from 'react'
import { BookOpen, ChevronDown, ChevronsRight, Inbox, Layers, PlusCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import { useUserHideClosedPositions } from 'state/user/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'
import { PositionDetails } from 'types/position'

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
const NoLiquidity = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
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

export default function Pool() {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const theme = useContext(ThemeContext)
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()

  const { positions, loading: positionsLoading } = useV3Positions(account)

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
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
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
                        <ThemedText.Body style={{ alignItems: 'center', display: 'flex' }}>
                          <Trans>More</Trans>
                          <ChevronDown size={15} />
                        </ThemedText.Body>
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
                <NoLiquidity>
                  <ThemedText.Body color={theme.text3} textAlign="center">
                    <Inbox size={48} strokeWidth={1} style={{ marginBottom: '.5rem' }} />
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
                </NoLiquidity>
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
  )
}
