import React from 'react'
import styled from 'styled-components'

import TwitterIcon from 'components/Icons/TwitterIcon'
import DiscordIcon from 'components/Icons/DiscordIcon'
import { ExternalLink } from 'theme'

const StyledSocialLinks = styled.div`
  display: flex;
  align-items: center;
  margin-left: 8px;
  padding: 6px 9px 6px 10px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.bg13};
`

const StyledTwitterIcon = styled.div`
  display: flex;
  align-items: center;
  padding-right: 6px;
  border-right: solid 0.6px #859aa5;
`

const StyledDiscordIcon = styled.div`
  display: flex;
  align-items: center;
  padding-left: 6px;
`

export default function SocialLinks() {
  return (
    <StyledSocialLinks>
      <ExternalLink href="https://twitter.com/kybernetwork">
        <StyledTwitterIcon>
          <TwitterIcon />
        </StyledTwitterIcon>
      </ExternalLink>
      <ExternalLink href="https://discord.gg/HdXWUb2pQM">
        <StyledDiscordIcon>
          <DiscordIcon />
        </StyledDiscordIcon>
      </ExternalLink>
    </StyledSocialLinks>
  )
}
