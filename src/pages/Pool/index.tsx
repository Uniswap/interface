import React, { useContext, useMemo } from 'react'
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
  border-radius: 1.3em;
  display: flex;
  flex-direction: column;
`

export default function Pool() {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)

  const { positions } = useV3Positions(account)

  const hasPositions = useMemo(() => Boolean(positions && positions.length > 0), [positions])

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
                <TYPE.mediumHeader>{t('Pool Overview')}</TYPE.mediumHeader>
              </HideSmall>
              <ButtonRow>
                <Menu
                  flyoutAlignment={FlyoutAlignment.LEFT}
                  ToggleUI={(props: any) => (
                    <MoreOptionsButton {...props}>
                      <TYPE.body style={{ alignItems: 'center', display: 'flex' }}>
                        {t('More')}
                        <ChevronDown size={15} />
                      </TYPE.body>
                    </MoreOptionsButton>
                  )}
                  menuItems={menuItems}
                />
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/ETH">
                  + {t('New Position')}
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            <MainContentWrapper>
              {hasPositions && positions ? (
                <PositionList positions={positions} />
              ) : positions && !hasPositions ? (
                <NoLiquidity>
                  <TYPE.largeHeader color={theme.text3} textAlign="center">
                    <Inbox />
                    <div>{t('Your liquidity positions will appear here.')}</div>
                  </TYPE.largeHeader>
                  {!account ? (
                    <ButtonPrimary style={{ marginTop: '1em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                      {t('Connect a wallet')}
                    </ButtonPrimary>
                  ) : (
                    hasV2Liquidity && (
                      <ButtonPrimary
                        as={Link}
                        to="/migrate/v2"
                        id="import-pool-link"
                        style={{ marginTop: '1em', padding: '8px 16px' }}
                      >
                        {t('Migrate v2 liquidity')}&nbsp;&nbsp;
                        <Download size={16} />
                      </ButtonPrimary>
                    )
                  )}
                </NoLiquidity>
              ) : (
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
              )}
            </MainContentWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
