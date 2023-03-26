import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { SwapPoolTabs } from 'components/NavigationTabs'
import FullPositionCard from 'components/PositionCard'
import PositionList from 'components/PositionList'
import { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { KROM } from 'constants/tokens'
import { useV3Positions } from 'hooks/useV3Positions'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext } from 'react'
import { Inbox } from 'react-feather'
import { Link } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import { useUserHideClosedPositions } from 'state/user/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { HideSmall, TYPE } from 'theme'
import { PositionDetails } from 'types/position'

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
  font-weight: 700;
  width: fit-content;
  margin-left: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.bg1};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 500px;
  padding: 15px;

  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 5px grey;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: grey;
    border-radius: 10px;
  }
`

export default function Pool() {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const theme = useContext(ThemeContext)
  const [userHideClosedPositions] = useUserHideClosedPositions()

  const { positions, loading: positionsLoading, fundingBalance, minBalance, gasPrice } = useV3Positions(account)

  const kromToken = chainId ? KROM[chainId] : undefined

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.processed ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const filteredPositions = [...openPositions, ...(userHideClosedPositions ? [] : closedPositions)]
  const showConnectAWallet = Boolean(!account)

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding={'10'}>
              <TYPE.body fontSize={'20px'}>
                <Trans>Account</Trans>
              </TYPE.body>
              <ButtonRow>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to={`/add/${kromToken?.address}/remove`}>
                  - <Trans>Withdraw KROM</Trans>
                </ResponsiveButtonPrimary>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to={`/add/${kromToken?.address}`}>
                  + <Trans>Deposit KROM</Trans>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            <FullPositionCard fundingBalance={fundingBalance} minBalance={minBalance} gasPrice={gasPrice} />
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  <Trans>Limit Orders</Trans>
                </TYPE.mediumHeader>
              </HideSmall>
              <ButtonRow>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to={`/limitorder`}>
                  + <Trans>New Limit Order</Trans>
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
              ) : filteredPositions && filteredPositions.length > 0 ? (
                <PositionList positions={filteredPositions} fundingBalance={fundingBalance} minBalance={minBalance} />
              ) : (
                <NoLiquidity>
                  <TYPE.body color={theme.text3} textAlign="center">
                    <Inbox size={48} strokeWidth={1} style={{ marginBottom: '.5rem' }} />
                    <div>
                      <Trans>Your limit orders will appear here.</Trans>
                    </div>
                  </TYPE.body>
                  {showConnectAWallet && (
                    <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                      <Trans>Connect a wallet</Trans>
                    </ButtonPrimary>
                  )}
                </NoLiquidity>
              )}
            </MainContentWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}
