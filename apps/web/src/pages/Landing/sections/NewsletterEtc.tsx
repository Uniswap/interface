import { H2, H3 } from 'pages/Landing/components/Generics'
import { BookOpen, ChatBubbles, HelpCircle } from 'pages/Landing/components/Icons'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, styled, useSporeColors } from 'ui/src'

const SectionLayout = styled(Flex, {
  width: '100%',
  maxWidth: 1360,
  alignItems: 'center',
  p: 40,

  $lg: {
    p: 48,
  },

  $sm: {
    p: 24,
  },
})

const Layout = styled(Flex, {
  width: '100%',
  maxWidth: 1280,
  // TODO: tamagui needs a fix for changing display in media query in platform
  className: 'connect-with-us-layout',

  '$platform-web': {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridColumnGap: '16px',
    gridRowGap: '16px',
  },
})

const SectionCol = styled(Flex, {
  flex: 1,
  maxWidth: 1328,
  gap: 24,

  $lg: {
    gap: 24,
  },
})

const Card = styled(Flex, {
  containerType: 'normal',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  backgroundColor: '$surface2',
  position: 'relative',
  height: 250,
  borderRadius: 20,
  p: 32,
  overflow: 'hidden',

  $xl: {
    gap: 16,
    p: 24,
  },

  $lg: {
    gap: 16,
    p: 24,
    width: '100%',
  },
})

const SquareCard = styled(Card, {
  cursor: 'pointer',
  tag: 'a',
  className: 'text-decoration-none',

  '$platform-web': {
    gridColumn: 'span 1',
    gridRow: 'span 4',
  },

  $xl: {
    '$platform-web': {
      gridArea: `3 / span 2 / 5 / span 2`,
    },
  },
})

const RectCard = styled(Card, {
  cursor: 'pointer',
  tag: 'a',

  '$platform-web': {
    textDecoration: 'none',
    gridColumn: 'span 2',
    gridRow: 'span 4',
    gap: 32,
  },
})

const helpPrimary = '#FF4D00'
const blogPrimary = '#8E8767'

export function NewsletterEtc() {
  const { t } = useTranslation()
  const theme = useSporeColors()

  return (
    <SectionLayout>
      <Flex row maxWidth={1328} gap="$spacing24" width="100%">
        <SectionCol justifyContent="space-between" height="100%">
          <H2>
            <Trans i18nKey="landing.connectWithUs" />
          </H2>
          <Layout>
            <SquareCard
              group="card"
              href="https://help.uniswap.org/"
              target="_blank"
              rel="noopener noreferrer"
              backgroundColor="rgba(255, 77, 0, 0.04)"
              $theme-dark={{
                backgroundColor: 'rgba(255, 77, 0, 0.08)',
              }}
            >
              <PillButton icon={<HelpCircle fill={helpPrimary} />} color={helpPrimary} label={t('common.helpCenter')} />
              <H3 color={helpPrimary}>
                <Trans i18nKey="common.getSupport.button" />
              </H3>
            </SquareCard>
            <SquareCard
              group="card"
              href="https://blog.uniswap.org/"
              target="_blank"
              rel="noopener noreferrer"
              backgroundColor="rgba(98, 84, 50, 0.04)"
              $theme-dark={{
                backgroundColor: 'rgba(98, 84, 50, 0.16)',
              }}
            >
              <PillButton icon={<BookOpen fill={blogPrimary} />} color={blogPrimary} label={t('common.blog')} />
              <H3 color={blogPrimary}>
                <Trans i18nKey="landing.teamInsights" />
              </H3>
            </SquareCard>
            <RectCard
              group="card"
              href="https://twitter.com/Uniswap/"
              target="_blank"
              rel="noopener noreferrer"
              backgroundColor="$accent2"
            >
              <PillButton
                icon={<ChatBubbles fill={theme.accent1.val} />}
                color={theme.accent1.val}
                label={t('common.stayConnected')}
              />
              <Text color="$accent1" fontSize={24}>
                <Trans i18nKey="landing.followOnX" />
              </Text>
            </RectCard>
          </Layout>
        </SectionCol>
      </Flex>
    </SectionLayout>
  )
}
