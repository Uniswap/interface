import { Flex, Text, useIsDarkMode } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import darkImage from '~/assets/images/404-page-dark.png'
import lightImage from '~/assets/images/404-page-light.png'
import { useIsMobile } from '~/hooks/screenSize/useIsMobile'

const Image = styled('img', {
  platform: 'web',
  base: 'max-w-[510px] w-full py-0 px-[75px]',
})

const Container = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-center',
})

const Header = styled(Container, {
  platform: 'web',
  base: 'gap-[30px]',
})

const PageWrapper = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-center flex-1 justify-center gap-[50px] min-[768px]:justify-between min-[768px]:pt-[64px]',
})

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
