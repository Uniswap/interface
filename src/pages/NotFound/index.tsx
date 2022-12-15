import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { SmallButtonPrimary } from 'components/Button'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import darkImage from '../../assets/images/404-page-dark.png'
import lightImage from '../../assets/images/404-page-light.png'

const Image = styled.img`
  margin: 20px;
  width: 440px;
`

const PageWrapper = styled.div`
  display: flex;
  height: calc(100vh - ${({ theme }) => theme.navHeight}px);
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`

export default function NotFound() {
  const theme = useTheme()
  return (
    <PageWrapper>
      <Trace page="404-page" shouldLogImpression>
        <ThemedText.Hero>404</ThemedText.Hero>
        <ThemedText.HeadlineLarge color="textSecondary">
          <Trans>Page not found!</Trans>
        </ThemedText.HeadlineLarge>
        <Image src={theme.isDark ? darkImage : lightImage} alt="404 page" />
        <SmallButtonPrimary onClick={() => window.location.reload()}>
          <Trans>Oops, take me back to Swap</Trans>
        </SmallButtonPrimary>
      </Trace>
    </PageWrapper>
  )
}
