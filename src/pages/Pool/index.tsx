import { useContext } from 'react'
import { ButtonGray, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { SwapPoolTabs } from 'components/NavigationTabs'
import PositionList from 'components/PositionList'
import { RowBetween, RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks/web3'
import { useV3Positions } from 'hooks/useV3Positions'
import { BookOpen, ChevronDown, Download, Inbox, PlusCircle, ChevronsRight, Layers } from 'react-feather'
import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import styled, { ThemeContext } from 'styled-components'
import { HideSmall, TYPE } from 'theme'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { LoadingRows } from './styleds'
import Toggle from 'components/Toggle'
import { useUserHideClosedPositions } from 'state/user/hooks'

import CTACards from './CTACards'
import { PositionDetails } from 'types/position'

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
    flex-direction: column-reverse;
  `};
`
const ButtonRow = styled(RowFixed)`
  & > *:not(:last-child) {
    margin-right: 8px;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  `};
`
const Menu = styled(NewMenu)`
  margin-left: 0;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 49%;
  `};
`
const MenuItem = styled.div`
  align-items: center;
  display: flex;
  justify-content: flex-start;
`
const MoreOptionsButton = styled(ButtonGray)`
  border-radius: 12px;
  flex: 1 1 auto;
  padding: 6px 8px;
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
    width: 49%;
  `};
`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.bg0};
  padding: 8px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
`

const ShowInactiveToggle = styled.div`
  display: grid;
  align-items: center;
  justify-items: end;

  grid-template-columns: 1fr auto;
  grid-column-gap: 8px;
  padding: 0 8px;
`

export default function Pool() {
  const { account } = useActiveWeb3React()
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

  const menuItems = [
    {
      content: (
        <MenuItem>
          <PlusCircle size={16} style={{ marginRight: '12px' }} />
          <Trans>Create a pool</Trans>
        </MenuItem>
      ),
      link: '/add/ETH',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <ChevronsRight size={16} style={{ marginRight: '12px' }} />
          <Trans>Migrate</Trans>
        </MenuItem>
      ),
      link: '/migrate/v2',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Layers size={16} style={{ marginRight: '12px' }} />
          <Trans>V2 liquidity</Trans>
        </MenuItem>
      ),
      link: '/pool/v2',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <BookOpen size={16} style={{ marginRight: '12px' }} />
          <Trans>Learn</Trans>
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
              <HideSmall>
                <TYPE.mediumHeader>
                  <Trans>Pools Overview</Trans>
                </TYPE.mediumHeader>
              </HideSmall>
              <ButtonRow>
                <Menu
                  menuItems={menuItems}
                  flyoutAlignment={FlyoutAlignment.LEFT}
                  ToggleUI={(props: any) => (
                    <MoreOptionsButton {...props}>
                      <TYPE.body style={{ alignItems: 'center', display: 'flex' }}>
                        <Trans>More</Trans>
                        <ChevronDown size={15} />
                      </TYPE.body>
                    </MoreOptionsButton>
                  )}
                />
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/ETH">
                  + <Trans>New Position</Trans>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            <CTACards />

            {closedPositions.length > 0 ? (
              <ShowInactiveToggle>
                <TYPE.darkGray>
                  <Trans>Closed positions</Trans>
                </TYPE.darkGray>
                <Toggle
                  isActive={!userHideClosedPositions}
                  toggle={() => setUserHideClosedPositions(!userHideClosedPositions)}
                  checked={<Trans>Show</Trans>}
                  unchecked={<Trans>Hide</Trans>}
                />
              </ShowInactiveToggle>
            ) : null}

            <MainContentWrapper>
              {positionsLoading ? (
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
              ) : filteredPositions && filteredPositions.length > 0 ? (
                <PositionList positions={filteredPositions} />
              ) : (
                <NoLiquidity>
                  <TYPE.mediumHeader color={theme.text3} textAlign="center">
                    <Inbox size={48} strokeWidth={1} style={{ marginBottom: '.5rem' }} />
                    <div>
                      <Trans>Your V3 liquidity positions will appear here.</Trans>
                    </div>
                  </TYPE.mediumHeader>
                  {!account ? (
                    <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                      <Trans>Connect a wallet</Trans>
                    </ButtonPrimary>
                  ) : (
                    <ButtonGray
                      as={Link}
                      to="/migrate/v2"
                      id="import-pool-link"
                      style={{ marginTop: '2em', padding: '8px 16px', borderRadius: '12px', width: 'fit-content' }}
                    >
                      <Trans>Migrate V2 liquidity</Trans>?&nbsp;&nbsp;
                      <Download size={16} />
                    </ButtonGray>
                  )}
                </NoLiquidity>
              )}
            </MainContentWrapper>
            <RowFixed justify="center" style={{ width: '100%' }}>
              <ButtonOutlined
                as={Link}
                to="/pool/v2"
                id="import-pool-link"
                style={{
                  padding: '8px 16px',
                  margin: '0 4px',
                  borderRadius: '12px',
                  width: 'fit-content',
                  fontSize: '14px',
                }}
              >
                <Layers size={14} style={{ marginRight: '8px' }} />

                <Trans>View V2 Liquidity</Trans>
              </ButtonOutlined>
              {positions && positions.length > 0 && (
                <ButtonOutlined
                  as={Link}
                  to="/migrate/v2"
                  id="import-pool-link"
                  style={{
                    padding: '8px 16px',
                    margin: '0 4px',
                    borderRadius: '12px',
                    width: 'fit-content',
                    fontSize: '14px',
                  }}
                >
                  <ChevronsRight size={16} style={{ marginRight: '8px' }} />

                  <Trans>Migrate Liquidity</Trans>
                </ButtonOutlined>
              )}
            </RowFixed>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}
