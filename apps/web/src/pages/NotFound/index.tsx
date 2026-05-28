import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useIsDarkMode } from 'ui/src'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import darkImage from '~/assets/images/404-page-dark.png'
import lightImage from '~/assets/images/404-page-light.png'
import { useIsMobile } from '~/hooks/screenSize/useIsMobile'
import { deprecatedStyled } from '~/lib/deprecated-styled'

const Image = deprecatedStyled.img`
  max-width: 510px;
  width: 100%;
  padding: 0 75px;
`

const Container = deprecatedStyled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Header = deprecatedStyled(Container)`
  gap: 30px;
`

const PageWrapper = deprecatedStyled(Container)`
  flex: 1;
  justify-content: center;
  gap: 50px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    justify-content: space-between;
    padding-top: 64px;
  }
`

interface NotFoundProps {
  title?: ReactNode
  subtitle?: ReactNode
  actionButton?: ReactNode
}

export function NotFound({ title, subtitle, actionButton }: NotFoundProps) {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const isMobile = useIsMobile()

  return (
    <PageWrapper>
      <Trace logImpression page={InterfacePageName.NotFound}>
        <Header>
          <Container>
            {title ?? <Text variant={isMobile ? 'heading2' : 'heading1'}>404</Text>}
            {subtitle ?? (
              <Text variant={isMobile ? 'heading3' : 'heading2'} color="$neutral2">
                {t('common.pageNotFound')}
              </Text>
            )}
          </Container>
          <Image src={isDarkMode ? darkImage : lightImage} alt="Liluni" />
        </Header>
        {actionButton ?? (
          <Flex row alignSelf="stretch">
            <Button href="/" tag="a" variant="branded" $platform-web={{ textDecoration: 'none' }}>
              {t('notFound.oops')}
            </Button>
          </Flex>
        )}
      </Trace>
    </PageWrapper>
  )
}

export default NotFound
