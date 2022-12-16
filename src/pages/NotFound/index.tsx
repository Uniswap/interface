import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { SmallButtonPrimary } from 'components/Button'
import { useIsMobile } from 'nft/hooks'
import { Link } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import darkImage from '../../assets/images/404-page-dark.png'
import lightImage from '../../assets/images/404-page-light.png'

const Image = styled.img`
  max-width: 510px;
  width: 100%;
  padding: 0 75px;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Header = styled(Container)`
  gap: 30px;
`

const PageWrapper = styled(Container)`
  flex: 1;
  justify-content: center;
  gap: 50px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    justify-content: space-between;
    padding-top: 64px;
  }
`

export default function NotFound() {
  const isDarkMode = useIsDarkMode()
  const isMobile = useIsMobile()

  const Title = isMobile ? ThemedText.LargeHeader : ThemedText.Hero
  const Paragraph = isMobile ? ThemedText.HeadlineMedium : ThemedText.HeadlineLarge

  return (
    <PageWrapper>
      <Trace page="404-page" shouldLogImpression>
        <Header>
          <Container>
            <Title>404</Title>
            <Paragraph color="textSecondary">
              <Trans>Page not found!</Trans>
            </Paragraph>
          </Container>
          <Image src={isDarkMode ? darkImage : lightImage} alt="Liluni" />
        </Header>
        <SmallButtonPrimary as={Link} to="/">
          <Trans>Oops, take me back to Swap</Trans>
        </SmallButtonPrimary>
      </Trace>
    </PageWrapper>
  )
}
