import { Trans } from '@lingui/macro'
import { Unicon } from 'components/Unicon'
import useENSAvatar from 'hooks/useENSAvatar'
import { getTimeDifference } from 'nft/utils/date'
import React from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { shortenAddress } from 'utils'

// Mock data for friends' activity. Should be type Activity[]
const friendsActivity = [
  {
    ensName: 'friend1.eth',
    address: '0x24791Cac57BF48328D9FE103Ce402Cfe4c0D8b07',
    activity: 'Minted Azuki #2214',
    timestamp: Date.now(), // 1 hour ago
    image:
      'https://cdn.center.app/1/0xED5AF388653567Af2F388E6224dC7C4b3241C544/2214/92acd1de09f0f5e1c12a4f1b47306a8f7393f4053a32b439f5fc7ba8b797961e.png',
  },
  {
    address: '0x24791Cac57BF48328D9FE103Ce402Cfe4c0D8b07',
    activity: 'Swapped 0.1 ETH for 100 DAI',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 min ago
  },
  {
    ensName: 'friend1.eth',
    address: '0x24791Cac57BF48328D9FE103Ce402Cfe4c0D8b07',
    activity: 'Swapped 0.1 ETH for 100 DAI',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
  },
  // More activities...
]

export const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: ${({ theme }) => theme.breakpoint.lg};
  margin-left: auto;
  margin-right: auto;
  display: flex;
`

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  max-width: ${({ theme }) => theme.breakpoint.lg};

  margin-left: auto;
  margin-right: auto;

  justify-content: flex-start;
  align-items: flex-start;
`

const ActivityCard = styled.div`
  display: flex;
  flex-direction: column;

  gap: 20px;
  padding: 20px;
  width: 500px;

  background-color: ${({ theme }) => theme.surface1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
`
const CardHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  justify-content: space-between;
  white-space: nowrap;
`

const Who = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  width: 100%;
`

const ENSAvatarImg = styled.img`
  border-radius: 8px;
  height: 30px;
  width: 30px;
`
function PortfolioAvatar({ accountAddress }: { accountAddress: string }) {
  const { avatar, loading } = useENSAvatar(accountAddress, false)

  // if (loading) {
  //   return <Loader size={size} />
  // }
  if (avatar) {
    return <ENSAvatarImg src={avatar} alt="avatar" />
  }
  return <Unicon size={30} address={accountAddress} />
}

const ActivityFeed = () => {
  return (
    <ExploreContainer>
      <TitleContainer>
        <ThemedText.LargeHeader>
          <Trans>Feed</Trans>
        </ThemedText.LargeHeader>
      </TitleContainer>
      <FeedContainer>
        {friendsActivity
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((activity, index) => {
            return (
              <ActivityCard key={index}>
                <CardHeader>
                  <Who>
                    <PortfolioAvatar accountAddress={activity.address} />
                    <ThemedText.BodyPrimary>
                      {activity.ensName ?? shortenAddress(activity.address)}
                    </ThemedText.BodyPrimary>
                  </Who>
                  <ThemedText.LabelSmall>{getTimeDifference(activity.timestamp.toString())}</ThemedText.LabelSmall>
                </CardHeader>
                <ThemedText.BodySecondary>{activity.activity}</ThemedText.BodySecondary>
                {activity.image && (
                  <img src={activity.image} alt="activity image" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                )}
              </ActivityCard>
            )
          })}
      </FeedContainer>
    </ExploreContainer>
  )
}

export default ActivityFeed
