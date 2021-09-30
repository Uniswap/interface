import React from 'react'
import styled from 'styled-components'

import { KYBER_NETWORK_DISCORD_URL, KYBER_NETWORK_TWITTER_URL } from 'constants/index'
import TwitterIcon from 'components/Icons/TwitterIcon'
import DiscordIcon from 'components/Icons/DiscordIcon'
import { ExternalLink } from 'theme'

const StyledSocialLinks = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
`

const StyledTwitterIcon = styled.div`
  display: flex;
  align-items: center;
  padding-right: 6px;
  border-right: solid 0.6px ${({ theme }) => theme.subText};
`

const StyledDiscordIcon = styled.div`
  display: flex;
  align-items: center;
  padding-left: 6px;
`

export default function SocialLinks() {
  return (
    <StyledSocialLinks>
      <ExternalLink href={KYBER_NETWORK_TWITTER_URL}>
        <StyledTwitterIcon>
          <TwitterIcon />
        </StyledTwitterIcon>
      </ExternalLink>
      <ExternalLink href={KYBER_NETWORK_DISCORD_URL}>
        <StyledDiscordIcon>
          <DiscordIcon />
        </StyledDiscordIcon>
      </ExternalLink>
    </StyledSocialLinks>
  )
}
