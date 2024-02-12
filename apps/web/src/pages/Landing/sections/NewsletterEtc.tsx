import { t, Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import styled, { useTheme } from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { PillButton } from '../components/cards/PillButton'
import { Box, H2, H3 } from '../components/Generics'
import { BookOpen, ChatBubbles, HelpCircle } from '../components/Icons'

const SectionLayout = styled.div`
  width: 100%;
  max-width: 1360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40px;
  @media (max-width: 768px) {
    padding: 0 48px;
  }
  @media (max-width: 468px) {
    padding: 0 24px;
  }
`
const Layout = styled.div`
  width: 100%;
  max-width: 1280px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  grid-column-gap: 16px;
  grid-row-gap: 16px;
  @media (max-width: 768px) {
    grid-template-rows: repeat(2, 1fr);
    grid-template-columns: repeat(2, 1fr);
  }
`
const SectionCol = styled(Box)`
  flex-direction: column;
  max-width: 1328px;
  gap: 24px;
  @media (max-width: 768px) {
    gap: 24px;
  }
`
const Card = styled.a<{
  backgroundColor?: string
}>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  height: 250px;
  border-radius: 20px;
  padding: 32px 28px;
  overflow: hidden;
  text-decoration: none;
  background-color: ${(props) => props.backgroundColor || props.theme.surface2};
  @media (max-width: 1024px) {
    gap: 16px;
    padding: 24px;
  }
  @media (max-width: 768px) {
    gap: 16px;
    padding: 24px;
  }
`
const SquareCard = motion(styled(Card)`
  grid-column: span 1 / span 1;
  grid-row: span 4 / span 4;

  @media (max-width: 768px) {
    grid-column: span 4 / span 4;
    grid-row: span 1 / span 1;
  }
`)
const HelpCenterCard = styled(SquareCard)`
  @media (max-width: 1024px) {
    grid-column: span 2 / span 2;

    grid-row-start: 1;
    grid-row-end: 3;
  }
  @media (max-width: 768px) {
    grid-column: span 4 / span 4;
    grid-row: span 1 / span 1;
  }
`
const BlogCard = styled(SquareCard)`
  @media (max-width: 1024px) {
    grid-column: span 2 / span 2;

    grid-row-start: 3;
    grid-row-end: 5;
  }
  @media (max-width: 768px) {
    grid-column: span 4 / span 4;
    grid-row: span 1 / span 1;
  }
`
const RectCard = motion(styled(Card)`
  grid-column: span 2 / span 2;
  grid-row: span 4 / span 4;

  gap: 32px;

  @media (max-width: 768px) {
    grid-column: span 4 / span 4;
    grid-row: span 1 / span 1;
  }
`)

const helpPrimary = '#FF4D00'
const blogPrimary = '#8E8767'

export function NewsletterEtc() {
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()
  return (
    <SectionLayout>
      <Box direction="row" maxWidth="1328px" gap="24px" width="100%">
        <SectionCol justify-content="space-between" height="100%">
          <H2>
            <Trans>Connect with us</Trans>
          </H2>
          <Layout>
            <HelpCenterCard
              initial="initial"
              whileHover="hover"
              href="https://help.uniswap.org/"
              target="_blank"
              rel="noopener noreferrer"
              backgroundColor={isDarkMode ? 'rgba(255, 77, 0, 0.08)' : 'rgba(255, 77, 0, 0.04)'}
            >
              <PillButton icon={<HelpCircle fill={helpPrimary} />} color={helpPrimary} label={t`Help Center`} />
              <H3 color={helpPrimary}>
                <Trans>Get support</Trans>
              </H3>
            </HelpCenterCard>
            <BlogCard
              initial="initial"
              whileHover="hover"
              href="https://blog.uniswap.org/"
              target="_blank"
              rel="noopener noreferrer"
              backgroundColor={isDarkMode ? 'rgba(98, 84, 50, 0.16)' : 'rgba(98, 84, 50, 0.04)'}
            >
              <PillButton icon={<BookOpen fill={blogPrimary} />} color={blogPrimary} label={t`Blog`} />
              <H3 color={blogPrimary}>
                <Trans>Insights and news from the team</Trans>
              </H3>
            </BlogCard>
            <RectCard
              backgroundColor={theme.accent2}
              initial="initial"
              whileHover="hover"
              href="https://twitter.com/Uniswap/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <PillButton icon={<ChatBubbles fill={theme.accent1} />} color={theme.accent1} label={t`Stay connected`} />
              <H3 color={theme.accent1}>
                <Trans>Follow @Uniswap on X for the latest updates</Trans>
              </H3>
            </RectCard>
          </Layout>
        </SectionCol>
      </Box>
    </SectionLayout>
  )
}
