import React, { useContext } from 'react'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { SwapPoolTabs } from 'components/NavigationTabs'
import PositionList from 'components/PositionList'
import { RowBetween, RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useV3Positions } from 'hooks/useV3Positions'
import { BookOpen, ChevronDown, Download, Inbox, PlusCircle, ChevronsRight, Layers } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import styled, { ThemeContext } from 'styled-components'
import { HideSmall, TYPE } from 'theme'
import { LoadingRows } from './styleds'

import CTACards from './CTACards'

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

export default function Pool() {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)

  const { positions, loading: positionsLoading } = useV3Positions(account)

  const menuItems = [
    {
      content: (
        <MenuItem>
          <PlusCircle size={16} style={{ marginRight: '12px' }} />
          {t('Create a pool')}
        </MenuItem>
      ),
      link: '/add/ETH',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <ChevronsRight size={16} style={{ marginRight: '12px' }} />
          {t('Migrate')}
        </MenuItem>
      ),
      link: '/migrate/v2',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Layers size={16} style={{ marginRight: '12px' }} />
          {t('V2 liquidity')}
        </MenuItem>
      ),
      link: '/pool/v2',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <BookOpen size={16} style={{ marginRight: '12px' }} />
          {t('Learn')}
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
                <TYPE.mediumHeader>{t('Pools Overview')}</TYPE.mediumHeader>
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

            <CTACards />

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
                    <div>{t('Your V3 liquidity positions will appear here.')}</div>
                  </TYPE.mediumHeader>
                  {!account ? (
                    <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                      {t('Connect a wallet')}
                    </ButtonPrimary>
                  ) : (
                    <ButtonGray
                      as={Link}
                      to="/migrate/v2"
                      id="import-pool-link"
                      style={{ marginTop: '2em', padding: '8px 16px', borderRadius: '12px', width: 'fit-content' }}
                    >
                      {t('Migrate V2 liquidity')}?&nbsp;&nbsp;
                      <Download size={16} />
                    </ButtonGray>
                  )}
                </NoLiquidity>
              )}
            </MainContentWrapper>
            <RowFixed justify="center" style={{ width: '100%' }}>
              <ButtonGray
                as={Link}
                to="/pool/v2"
                id="import-pool-link"
                style={{ padding: '8px 16px', borderRadius: '12px', width: 'fit-content' }}
              >
                <TYPE.subHeader>{t('Looking for your V2 Liquidity')}?</TYPE.subHeader>
              </ButtonGray>
            </RowFixed>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
