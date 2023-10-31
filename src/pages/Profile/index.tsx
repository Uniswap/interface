import { Trans } from '@lingui/macro'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { ParentSize } from '@visx/responsive'
import { useWeb3React } from '@web3-react/core'
import { AccountDrawerScrollWrapper } from 'components/AccountDrawer'
import { AccountNamesWrapper } from 'components/AccountDrawer/AuthenticatedHeader'
import NFTs from 'components/AccountDrawer/MiniPortfolio/NFTs'
import { PortfolioAvatar } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import Tokens from 'components/AccountDrawer/MiniPortfolio/Tokens'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import { PriceChart } from 'components/Charts/PriceChart'
import Column from 'components/Column'
import FollowingModal from 'components/Profile/FollowingModal'
import Row, { RowBetween } from 'components/Row'
import { useFeed } from 'components/SocialFeed/hooks'
import { usePriceHistory } from 'components/Tokens/TokenDetails/ChartSection'
import { getConnection } from 'connection'
import { UNI } from 'constants/tokens'
import {
  Chain,
  HistoryDuration,
  usePortfolioBalancesQuery,
  useTokenPriceQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { GQL_MAINNET_CHAINS, TimePeriod } from 'graphql/data/util'
import useENS from 'hooks/useENS'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import { ActivityList } from 'pages/SocialFeed'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components'
import { CopyHelper, Separator, ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { shortenAddress } from 'utils'

const followingAtom = atomWithStorage<string[]>('following', [])
export function useFollowedAccounts() {
  return useAtomValue(followingAtom)
}

function useIsFollowingAccount(account: string) {
  return useFollowedAccounts().includes(account.toLowerCase())
}

function useToggleFollowingAccount(): (account: string) => void {
  const updateFollowing = useUpdateAtom(followingAtom)
  return useCallback(
    (account: string) => {
      updateFollowing((following) => {
        const lowercasedAccount = account.toLowerCase()
        const index = following.indexOf(lowercasedAccount, 0)

        if (index !== -1) {
          const newFollowing = [...following]
          newFollowing.splice(index, 1)
          return newFollowing
        } // remove if already following
        return [...following, lowercasedAccount] // add follower if not yet following
      })
    },
    [updateFollowing]
  )
}

const Container = styled(Column)`
  /* justify-items: center; */
  margin-top: 64px;
  width: 1120px;
  gap: 20px;
`

const RemoveMarginWrapper = styled.div`
  margin: 0 -16px 0 -16px;
`

const TabContainer = styled(Column)`
  background-color: ${({ theme }) => theme.surface2};
  padding: 16px;
  border-radius: 20px;
  width: 360px;
  height: 580px;
  overflow: hidden;
`

const ChartContainer = styled(TabContainer)`
  background-color: ${({ theme }) => opacify(8, theme.accent1)};
  padding: 16px;
  height: unset;
  width: 100%;
`

const ActivityContainer = styled(TabContainer)`
  height: 990px;
  min-width: 500px;
`

const CopyText = styled(CopyHelper).attrs({
  iconSize: 14,
  iconPosition: 'right',
})``

const FollowButton = styled.button`
  border-radius: 20px;
  border: 1.5px solid ${({ theme }) => theme.accent1};
  width: 200px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: ${({ theme }) => opacify(10, theme.accent1)};
  :hover {
    background-color: ${({ theme }) => opacify(24, theme.accent1)};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `background-color ${duration.fast} ${timing.ease}`};
`

const FollowingContainer = styled.button`
  border-radius: 20px;
  border: 1.5px solid #ffefff;
  width: 200px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  text-color: #fc72ff;
  background-color: #ffefff;
  :hover {
    background-color: ${({ theme }) => opacify(24, theme.accent1)};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `background-color ${duration.fast} ${timing.ease}`};
`

const Pages = [
  {
    title: <Trans>Tokens</Trans>,
    key: 'tokens',
    Component: Tokens,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_TOKENS_TAB,
  },
  {
    title: <Trans>NFTs</Trans>,
    key: 'nfts',
    Component: NFTs,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_NFT_TAB,
  },
  // {
  //   title: <Trans>Pools</Trans>,
  //   key: 'pools',
  //   Component: Pools,
  //   loggingElementName: InterfaceElementName.MINI_PORTFOLIO_POOLS_TAB,
  // },
  // {
  //   title:
  //   key: 'activity',
  //   Component: ActivityTab,
  //   loggingElementName: InterfaceElementName.MINI_PORTFOLIO_ACTIVITY_TAB,
  // },
]

export default function ProfilePage() {
  const { accountAddress = '' } = useParams()
  const { account: currentAccount } = useWeb3React()
  const connection = getConnection(useWeb3React().connector)
  const { address: ensResolvedAddress, name } = useENS(accountAddress)

  const account = ensResolvedAddress ?? accountAddress

  usePortfolioBalancesQuery({
    skip: !account,
    variables: { ownerAddress: account ?? '', chains: GQL_MAINNET_CHAINS },
    errorPolicy: 'all',
  })

  const { data: tokenPriceQuery } = useTokenPriceQuery({
    variables: {
      address: UNI[1].address,
      chain: Chain.Ethereum,
      duration: HistoryDuration.Week,
    },
    errorPolicy: 'all',
  })
  const prices = usePriceHistory(tokenPriceQuery)

  const isFollowingAccount = useIsFollowingAccount(account)
  const toggleFollowingAccount = useToggleFollowingAccount()

  const openFollowingModal = useOpenModal(ApplicationModal.FOLLOWING)

  const feed = useFeed([account])

  return (
    <Container>
      <RowBetween>
        <Row>
          <PortfolioAvatar accountAddress={account} size={80} />
          <AccountNamesWrapper>
            <ThemedText.SubHeader fontSize={name ? 16 : 24}>
              <CopyText toCopy={account}>{name ? shortenAddress(account) : account}</CopyText>
            </ThemedText.SubHeader>
            {/* Displays smaller view of account if ENS name was rendered above */}
            {name && (
              <ThemedText.HeadlineLarge>
                <CopyHelper toCopy={account} iconSize={24} iconPosition="right">
                  {name}
                </CopyHelper>
              </ThemedText.HeadlineLarge>
            )}
          </AccountNamesWrapper>
        </Row>
        {currentAccount === account ? (
          <ThemeButton size={ButtonSize.large} emphasis={ButtonEmphasis.medium} onClick={() => openFollowingModal()}>
            <Trans>Followers</Trans>
          </ThemeButton>
        ) : (
          <FollowButton onClick={() => toggleFollowingAccount(account)}>
            <ThemedText.HeadlineSmall>
              {isFollowingAccount ? <Trans>Following</Trans> : <Trans>+ Follow</Trans>}
            </ThemedText.HeadlineSmall>
          </FollowButton>
        )}
      </RowBetween>

      <Separator />
      <Row gap="20px" align="flex-start">
        <Column gap="lg">
          <ChartContainer>
            <ParentSize>
              {({ width }) => (
                <PriceChart prices={prices} width={width} height={348} timePeriod={TimePeriod.WEEK} activity={[]} />
              )}
            </ParentSize>
          </ChartContainer>

          <Row align="flex-start" gap="20px">
            {Pages.map(({ title, key, Component }) => (
              <TabContainer key={key}>
                <AccountDrawerScrollWrapper>
                  <ThemedText.SubHeader>{title}</ThemedText.SubHeader>
                  <RemoveMarginWrapper>
                    <Component account={account} />
                  </RemoveMarginWrapper>
                </AccountDrawerScrollWrapper>
              </TabContainer>
            ))}
          </Row>
        </Column>

        <ActivityContainer>
          <AccountDrawerScrollWrapper>
            <Trans>Activity</Trans>
            <RemoveMarginWrapper>
              <ActivityList feed={feed} hidePrice={true} />
            </RemoveMarginWrapper>
          </AccountDrawerScrollWrapper>
        </ActivityContainer>
      </Row>
      <FollowingModal />
    </Container>
  )
}
