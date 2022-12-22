import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import DiscoverIcon from 'components/Icons/DiscoverIcon'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'

import SlideToUnlock from './SlideToUnlock'
import { StyledNavLink } from './styleds'

const DiscoverWrapper = styled.span`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const CustomSlideToUnlock = styled(SlideToUnlock)`
  background: linear-gradient(
    to right,
    ${({ theme }) => theme.subText} 0,
    white 10%,
    ${({ theme }) => theme.subText} 20%
  );
  background-clip: text;
  -webkit-background-clip: text;

  &[data-active='true'] {
    background: linear-gradient(
      to right,
      ${({ theme }) => theme.primary} 0,
      white 10%,
      ${({ theme }) => theme.primary} 20%
    );
    /* Repetitive but not redundant */
    background-clip: text;
    -webkit-background-clip: text;
  }

  &:hover {
    background: linear-gradient(
      to right,
      ${({ theme }) => darken(0.1, theme.primary)} 0,
      white 10%,
      ${({ theme }) => darken(0.1, theme.primary)} 20%
    );
    /* Repetitive but not redundant */
    background-clip: text;
    -webkit-background-clip: text;
  }
`

const DiscoverNavItem = () => {
  const { pathname } = useLocation()
  const isActive = pathname.includes(APP_PATHS.DISCOVER)
  return (
    <DiscoverWrapper id={TutorialIds.DISCOVER_LINK}>
      <StyledNavLink to={'/discover?tab=trending_soon'} style={{ alignItems: 'center' }}>
        <CustomSlideToUnlock data-active={isActive}>
          <Trans>Discover</Trans>
        </CustomSlideToUnlock>
        <DiscoverIcon size={14} style={{ marginTop: '-20px', marginLeft: '4px' }} />
      </StyledNavLink>
    </DiscoverWrapper>
  )
}

export default DiscoverNavItem
