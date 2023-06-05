import styled from 'styled-components/macro'

import { ReactComponent as DiscordI } from './images/discord.svg'
import { ReactComponent as GithubI } from './images/github.svg'
import { ReactComponent as TwitterI } from './images/twitter-safe.svg'

export const DiscordIcon = styled(DiscordI)<{ size?: number; fill?: string }>`
  height: ${({ size }) => (size ? size + 'px' : '32px')};
  width: ${({ size }) => (size ? size + 'px' : '32px')};
  fill: ${({ fill }) => fill ?? '#98A1C0'};
  opacity: 1;
`

export const TwitterIcon = styled(TwitterI)<{ size?: number; fill?: string }>`
  height: ${({ size }) => (size ? size + 'px' : '32px')};
  width: ${({ size }) => (size ? size + 'px' : '32px')};
  fill: ${({ fill }) => fill ?? '#98A1C0'};
  opacity: 1;
`

export const GithubIcon = styled(GithubI)<{ size?: number; fill?: string }>`
  height: ${({ size }) => (size ? size + 'px' : '32px')};
  width: ${({ size }) => (size ? size + 'px' : '32px')};
  fill: ${({ fill }) => fill ?? '#98A1C0'};
  opacity: 1;
`
