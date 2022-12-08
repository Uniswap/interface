import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ShareButtonWithModal } from 'components/ShareModal'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { getSlugUrlCampaign } from 'utils/campaign'
import oembed2iframe from 'utils/oembed2iframe'

const StyledLink = styled(ExternalLink)`
  font-size: 14px;
  font-weight: 400;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 12px;
  `}
`

const HTMLWrapper = styled.div`
  word-break: break-word;

  font-size: 14px;
  line-height: 20px;

  p,
  li,
  span,
  div {
    font-size: 14px;
    line-height: 20px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 12px;
    line-height: 16px;

    p,
    li,
    span,
    div {
      font-size: 12px;
      line-height: 16px;
    }
  `}
`

const StyledText = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;

  color: ${({ theme }) => theme.text};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 12px;
    line-height: 16px;
  `}
`

const ListCampaignWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 12px;
    line-height: 20px;
  `}
`

const Wrapper = styled.div<{ $background?: string }>`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 24px;
  padding: 16px 20px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 16px;
  `}

  ${({ $background }) =>
    $background
      ? css`
          background: ${$background};
        `
      : ''}
`

type Props = {
  name: string
  description: string
  campaigns: Array<{
    id: number
    name: string
  }>
  background?: string
}

const ExpandedRankingSection: React.FC<Props> = ({ name, description, campaigns, background }) => {
  const theme = useTheme()
  return (
    <Wrapper $background={background}>
      <Flex
        sx={{
          width: '100%',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <StyledText>
          <Trans>About {name}</Trans>
        </StyledText>
        <HTMLWrapper dangerouslySetInnerHTML={{ __html: oembed2iframe(description) }} />
      </Flex>

      <ListCampaignWrapper>
        <StyledText>
          <Trans>Campaigns</Trans>
        </StyledText>
        <Flex
          sx={{
            flexDirection: 'column',
          }}
        >
          {campaigns.map((campaign, i) => {
            const path = getSlugUrlCampaign(campaign.id, campaign.name)
            const url = `${window.location.origin}${path}`
            return (
              <Flex
                key={campaign.id}
                sx={{
                  padding: '8px 0',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '24px',
                  borderTop: i === 0 ? undefined : `1px solid ${theme.border}`,
                }}
              >
                <StyledLink href={path}>
                  {i + 1}. {campaign.name} ↗
                </StyledLink>

                <Flex
                  sx={{
                    flex: '0 0 36px',
                    marginRight: '-8px',
                  }}
                >
                  <ShareButtonWithModal url={url} color={theme.primary} />
                </Flex>
              </Flex>
            )
          })}
        </Flex>
      </ListCampaignWrapper>
    </Wrapper>
  )
}

export default ExpandedRankingSection
