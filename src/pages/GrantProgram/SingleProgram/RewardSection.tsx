import { Trans } from '@lingui/macro'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'

import RewardImage from 'assets/images/campaign_reward.png'
import oembed2iframe from 'utils/oembed2iframe'

import { HeaderText } from '../styleds'

const HTMLWrapper = styled.div`
  word-break: break-word;

  font-size: 20px;
  line-height: 24px;
  p,
  li,
  span,
  div {
    font-size: 20px;
    line-height: 24px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 16px;
    line-height: 20px;

    p,
    li,
    span,
    div {
      font-size: 16px;
      line-height: 20px;
    }
  `}
`

const StyledRewardImg = styled.img`
  width: 100%;
  height: auto;
  margin-top: -110px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-top: 0;
  `}
`

const StyledTitle = styled.span`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 12px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 16px;
    line-height: 20px;
  `}
`

const StyledSubtitle = styled.span`
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  margin-bottom: 16px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 16px;
    line-height: 20px;
  `}
`

const Wrapper = styled.div`
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 160px;
  gap: 48px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 24px;
  `}
`

type Props = {
  rewardDetails?: string
}

const RewardDetails: React.FC<Props> = ({ rewardDetails }) => {
  return (
    <Flex maxWidth="500px" flexDirection="column">
      <StyledTitle>
        <Trans>Attract the most Participants to win</Trans>
      </StyledTitle>

      <StyledSubtitle>
        <Trans>
          The final winning projects have the highest total of participants at the end of the 3-month grant campaign.
        </Trans>
      </StyledSubtitle>

      {rewardDetails ? <HTMLWrapper dangerouslySetInnerHTML={{ __html: oembed2iframe(rewardDetails) }} /> : null}
    </Flex>
  )
}

const RewardSection: React.FC<Props> = props => {
  return (
    <Wrapper>
      <HeaderText>Rewards</HeaderText>

      <Flex
        sx={{
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <RewardDetails {...props} />
        <Box>
          <StyledRewardImg alt="reward" src={RewardImage} />
        </Box>
      </Flex>
    </Wrapper>
  )
}

export default RewardSection
