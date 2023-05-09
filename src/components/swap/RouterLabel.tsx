import { RouterPreference } from 'state/routing/slice'
import { useRouterPreference } from 'state/user/hooks'
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

  fill: ${({ theme }) => theme.textTertiary};

  :hover {
    filter: brightness(1.3);
  }
`

const StyledAutoRouterLabel = styled(ThemedText.DeprecatedBlack)`
  line-height: 1rem;

  /* fallback color */
  color: ${({ theme }) => theme.accentSuccess};

  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

export default function RouterLabel() {
  const [routerPreference] = useRouterPreference()

  switch (routerPreference) {
    case RouterPreference.AUTO:
    case RouterPreference.API:
      return <ThemedText.BodySmall>Uniswap API</ThemedText.BodySmall>
    case RouterPreference.CLIENT:
      return <ThemedText.BodySmall>Uniswap Client</ThemedText.BodySmall>
  }
}
