import React, { useContext } from 'react'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { SwapPoolTabs } from 'components/NavigationTabs'
import PositionList from 'components/PositionList'
import { RowBetween, RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useV3Positions } from 'hooks/useV3Positions'
import { BookOpen, ChevronDown, Download, Inbox, PlusCircle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import styled, { ThemeContext } from 'styled-components'
import { HideSmall, TYPE } from 'theme'
import { LoadingRows } from './styleds'

const PageWrapper = styled(AutoColumn)`
  max-width: 870px;
  width: 100%;
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
  padding: 16px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
`

export default function Pool() {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)

  const { positions, loading: positionsLoading } = useV3Positions(account)

  const hasPositions = Boolean(positions && positions.length > 0)

  const hasV2Liquidity = true
  const showMigrateHeaderLink = Boolean(hasV2Liquidity && hasPositions)

  const menuItems = [
    {
      content: (
        <MenuItem>
          <PlusCircle size={16} style={{ marginRight: '8px' }} />
          {t('Create a pool')}
        </MenuItem>
      ),
      link: '/add/ETH',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Download size={16} style={{ marginRight: '8px' }} />
          {t('Migrate Liquidity')}
        </MenuItem>
      ),
      link: '/#/migrate/v2',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <BookOpen size={16} style={{ marginRight: '8px' }} />
          {t('Learn')}
        </MenuItem>
      ),
      link: 'https://uniswap.org/docs/v2/',
      external: true,
    },
  ]
  if (showMigrateHeaderLink) {
    menuItems.unshift({
      content: (
        <MenuItem>
          <Download size={16} style={{ marginRight: '8px' }} />
          {t('Migrate v2 liquidity')}
        </MenuItem>
      ),
      link: '/migrate/v2',
      external: false,
    })
  }

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader>Your Positions</TYPE.mediumHeader>
              </HideSmall>
              <ButtonRow>
                <Menu
                  menuItems={menuItems}
                  flyoutAlignment={FlyoutAlignment.LEFT}
                  ToggleUI={(props: any) => (
                    <MoreOptionsButton {...props}>
                      <TYPE.body style={{ alignItems: 'center', display: 'flex' }}>
                        {t('More')}
                        <ChevronDown size={15} />
                      </TYPE.body>
                    </MoreOptionsButton>
                  )}
                />
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/ETH">
                  + {t('New Position')}
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

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
              ) : positions && positions.length > 0 ? (
                <PositionList positions={positions} />
              ) : (
                <NoLiquidity>
                  <TYPE.mediumHeader color={theme.text3} textAlign="center">
                    <Inbox size={48} strokeWidth={1} style={{ marginBottom: '.5rem' }} />
                    <div>{t('Your liquidity positions will appear here.')}</div>
                  </TYPE.mediumHeader>
                  {!account ? (
                    <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                      {t('Connect a wallet')}
                    </ButtonPrimary>
                  ) : (
                    hasV2Liquidity && (
                      <ButtonGray
                        as={Link}
                        to="/migrate/v2"
                        id="import-pool-link"
                        style={{ marginTop: '2em', padding: '8px 16px', borderRadius: '12px', width: 'fit-content' }}
                      >
                        {t('Migrate V2 liquidity')}&nbsp;&nbsp;
                        <Download size={16} />
                      </ButtonGray>
                    )
                  )}
                </NoLiquidity>
              )}
            </MainContentWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
