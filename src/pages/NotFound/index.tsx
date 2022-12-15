import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { SmallButtonPrimary } from 'components/Button'
import { Link } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import darkImage from '../../assets/images/404-page-dark.png'
import lightImage from '../../assets/images/404-page-light.png'

const Image = styled.img`
  margin: 20px;
  max-width: 510px;
  width: 100%;
  padding: 0 75px;
`

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    flex: 1;
    justify-content: center;
  }
`

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  justify-content: space-between;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    padding-top: 65px;
  }
`

export default function NotFound() {
  const isDarkMode = useIsDarkMode()
  return (
    <PageWrapper>
      <Trace page="404-page" shouldLogImpression>
        <Center>
          <ThemedText.Hero>404</ThemedText.Hero>
          <ThemedText.HeadlineLarge color="textSecondary">
            <Trans>Page not found!</Trans>
          </ThemedText.HeadlineLarge>
          <Image src={isDarkMode ? darkImage : lightImage} alt="404 page" />
        </Center>
        <SmallButtonPrimary as={Link} to="/">
          <Trans>Oops, take me back to Swap</Trans>
        </SmallButtonPrimary>
      </Trace>
    </PageWrapper>
  )
}
