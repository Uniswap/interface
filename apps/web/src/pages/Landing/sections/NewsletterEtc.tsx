import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import styled, { useTheme } from 'styled-components'

import { PillButton } from '../components/cards/PillButton'
import { Box, H2, H3 } from '../components/Generics'
import { BookOpen, File, HelpCircle } from '../components/Icons'

const SectionLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px;
  @media (max-width: 768px) {
    padding: 0 64px;
  }
  @media (max-width: 468px) {
    padding: 0 24px;
  }
`
const Layout = styled.div`
  width: 100%;
  max-width: 1328px;

  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  grid-column-gap: 16px;
  grid-row-gap: 16px;
  @media (max-width: 768px) {
    grid-template-rows: repeat(3, 1fr);
  }
`
const SectionCol = styled(Box)`
  flex-direction: column;
  max-width: 1328px;
  gap: 48px;
  @media (max-width: 768px) {
    gap: 24px;
  }
`
const PlaceHolderInput = styled.input`
  position: relative;

  height: 56px;
  width: 100%;
  border-radius: 99px;
  border: none;
  padding: 0 32px;

  font-family: Basel;
  font-size: 18px;
  font-style: normal;
  font-weight: 535;

  color: ${({ theme }) => theme.neutral1};
  background-color: ${({ theme }) => theme.surface1};

  box-shadow: 0px 0px 0px 0px ${({ theme }) => theme.accent1};
  transition: box-shadow 0.1s ease-in-out;

  &:focus {
    outline: none;
    box-shadow: 0px 0px 0px 3px ${({ theme }) => theme.accent1};
  }
`
const Card = styled.div<{
  backgroundColor?: string
}>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  border-radius: 20px;
  padding: 32px 28px;
  overflow: hidden;
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
export function NewsletterEtc() {
  const theme = useTheme()
  return (
    <SectionLayout>
      <Box direction="row" maxWidth="1328px" gap="24px">
        <SectionCol justify-content="space-between" height="100%">
          <H2>
            <Trans>Learn more</Trans>
          </H2>
          <Layout>
            <HelpCenterCard initial="initial" whileHover="hover" backgroundColor={theme.surface2}>
              <PillButton icon={<HelpCircle fill={theme.neutral1} />} color={theme.neutral1} label="Help Center" />
              <H3>
                <Trans>Get support</Trans>
              </H3>
            </HelpCenterCard>
            <BlogCard initial="initial" whileHover="hover" backgroundColor={theme.surface2}>
              <PillButton icon={<BookOpen fill={theme.neutral1} />} color={theme.neutral1} label="Blog" />
              <H3>
                <Trans>Insights and updates from the team</Trans>
              </H3>
            </BlogCard>
            <RectCard backgroundColor={theme.accent2}>
              <PillButton
                icon={<File fill={theme.neutral1} />}
                color={theme.neutral1}
                label="Newsletter"
                cursor="default"
              />
              <H3 color={theme.accent1}>
                <Trans>Sign up for our newsletter to stay in touch with the latest updates, news, and events.</Trans>
              </H3>
              <PlaceHolderInput placeholder="enter email address" />
            </RectCard>
          </Layout>
        </SectionCol>
      </Box>
    </SectionLayout>
  )
}
