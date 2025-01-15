import { InterfacePageName } from '@uniswap/analytics-events'
import darkImage from 'assets/images/404-page-dark.png'
import lightImage from 'assets/images/404-page-light.png'
import { SmallButtonPrimary } from 'components/Button/buttons'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import Trace from 'uniswap/src/features/telemetry/Trace'

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

interface NotFoundProps {
  title?: ReactNode
  subtitle?: ReactNode
  actionButton?: ReactNode
}

export default function NotFound({ title, subtitle, actionButton }: NotFoundProps) {
  const isDarkMode = useIsDarkMode()
  const isMobile = useIsMobile()

  const Title = isMobile ? ThemedText.LargeHeader : ThemedText.Hero
  const Paragraph = isMobile ? ThemedText.HeadlineMedium : ThemedText.HeadlineLarge

  return (
    <PageWrapper>
      <Trace logImpression page={InterfacePageName.NOT_FOUND}>
        <Header>
          <Container>
            {title ?? <Title>404</Title>}
            {subtitle ?? (
              <Paragraph color="neutral2">
                <Trans i18nKey="common.pageNotFound" />
              </Paragraph>
            )}
          </Container>
          <Image src={isDarkMode ? darkImage : lightImage} alt="Liluni" />
        </Header>
        {actionButton ?? (
          <SmallButtonPrimary as={Link} to="/">
            <Trans i18nKey="notFound.oops" />
          </SmallButtonPrimary>
        )}
      </Trace>
    </PageWrapper>
  )
}
