import { Trans } from '@lingui/macro'
import useAutoRouterSupported from 'hooks/useAutoRouterSupported'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ReactComponent as StaticRouterIcon } from '../../assets/svg/static_route.svg'
import AutoRouterIcon from './AutoRouterIcon'

const StyledAutoRouterIcon = styled(AutoRouterIcon)`
  height: 16px;
  width: 16px;

  :hover {
    filter: brightness(1.3);
  }
`

const StyledStaticRouterIcon = styled(StaticRouterIcon)`
  height: 16px;
  width: 16px;

  fill: ${({ theme }) => theme.text3};

  :hover {
    filter: brightness(1.3);
  }
`

const StyledAutoRouterLabel = styled(ThemedText.Black)`
  line-height: 1rem;

  /* fallback color */
  color: ${({ theme }) => theme.green1};

  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

export function AutoRouterLogo() {
  const autoRouterSupported = useAutoRouterSupported()

  return autoRouterSupported ? <StyledAutoRouterIcon /> : <StyledStaticRouterIcon />
}

export function AutoRouterLabel() {
  const autoRouterSupported = useAutoRouterSupported()

  return autoRouterSupported ? (
    <StyledAutoRouterLabel fontSize={14}>Auto Router</StyledAutoRouterLabel>
  ) : (
    <ThemedText.Black fontSize={14}>
      <Trans>Trade Route</Trans>
    </ThemedText.Black>
  )
}
