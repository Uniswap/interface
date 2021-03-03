import { TokenAmount } from '@uniswap/sdk'
import Badge, { BadgeVariant } from 'components/Badge'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { SwapPoolTabs } from 'components/NavigationTabs'
import PositionList from 'components/PositionList'
import { RowBetween, RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import React, { useContext, useMemo } from 'react'
import { BookOpen, ChevronDown, Download, Inbox, Info, PlusCircle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import styled, { ThemeContext } from 'styled-components'
import { HideSmall, MEDIA_WIDTHS, TYPE } from 'theme'
import { basisPointsToPercent } from 'utils'
import { DAI, WBTC } from '../../constants'

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
const InactivePositionsBadge = styled(Badge)`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    display: flex;
  }
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
  padding: 24px;
  border-radius: 1.3em;
  display: flex;
  flex-direction: column;
`
const FEE_BIPS = {
  FIVE: basisPointsToPercent(5),
  THIRTY: basisPointsToPercent(30),
  ONE_HUNDRED: basisPointsToPercent(100),
}

function useV3Positions() {
  const positions = [
    {
      feesEarned: {
        DAI: 1000,
        WBTC: 0.005,
      },
      feeLevel: FEE_BIPS.FIVE,
      tokenAmount0: new TokenAmount(DAI, BigInt(0) * BigInt(10e18)),
      tokenAmount1: new TokenAmount(WBTC, BigInt(1) * BigInt(10e7)),
      tickLower: 40000,
      tickUpper: 60000,
    },
    {
      feesEarned: {
        DAI: 1000,
        WBTC: 0.005,
      },
      feeLevel: FEE_BIPS.THIRTY,
      tokenAmount0: new TokenAmount(DAI, BigInt(5000) * BigInt(10e18)),
      tokenAmount1: new TokenAmount(WBTC, BigInt(1) * BigInt(10e7)),
      tickLower: 45000,
      tickUpper: 55000,
    },
  ]
  const error = undefined
  const loading = false
  return { error, loading, positions }
}
export default function Pool() {
  const { error, loading, positions } = useV3Positions()
  const toggleWalletModal = useWalletModalToggle()
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  if (error) {
    console.error(error)
  }

  const numInactivePositions = useMemo(
    () =>
      positions.reduce((acc: any, position: any) => {
        const { tokenAmount0, tokenAmount1 } = position
        const limitCrossed = tokenAmount0.equalTo(BigInt(0)) || tokenAmount1.equalTo(BigInt(0))
        return limitCrossed ? acc + 1 : acc
      }, 0),
    [positions]
  )

  const hasV2Liquidity = true
  const showMigrateHeaderLink = hasV2Liquidity && positions.length > 0

  const menuItems = [
    {
      content: (
        <MenuItem>
          <PlusCircle size={16} style={{ marginRight: '8px' }} />
          {t('Create a pool')}
        </MenuItem>
      ),
      link: '/#/add',
    },
    {
      content: (
        <MenuItem>
          <BookOpen size={16} style={{ marginRight: '8px' }} />
          {t('Learn')}
        </MenuItem>
      ),
      link: 'https://uniswap.org/docs/v2/',
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
      link: '/#/migrate/v2',
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
                {numInactivePositions > 0 && (
                  <InactivePositionsBadge variant={BadgeVariant.WARNING_OUTLINE}>
                    <Info />
                    &nbsp;&nbsp;
                    {numInactivePositions}{' '}
                    {numInactivePositions === 1 ? t('Inactive position') : t('Inactive positions')}
                  </InactivePositionsBadge>
                )}
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
              {positions?.length > 0 ? (
                <PositionList loading={loading} positions={positions} />
              ) : (
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
              )}
            </MainContentWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
