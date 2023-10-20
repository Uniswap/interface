import { motion } from 'framer-motion'
import styled, { useTheme } from 'styled-components'

// import { GenericCard } from '../components/cards/GenericCard'
import { PillButton } from '../components/cards/PillButton'
import { Box, H2, H3 } from '../components/Generics'
import { BookOpen, File, HelpCircle } from '../components/Icons'

export function NewsletterEtc() {
  const theme = useTheme()
  return (
    <Box direction="column" align="center" padding="0 24px">
      <Box direction="row" maxWidth="1328px" gap="24px">
        <SectionCol justify-content="space-between" height="100%">
          <H2>Learn more</H2>
          <RowToCol gap="16px" width="100%" maxWidth="1328px">
            <SquareCard initial="initial" whileHover="hover" backgroundColor={theme.surface2}>
              <PillButton icon={<HelpCircle fill={theme.neutral1} />} color={theme.neutral1} label="Help Center" />
              <H3>Get support</H3>
            </SquareCard>

            <SquareCard initial="initial" whileHover="hover" backgroundColor={theme.surface2}>
              <PillButton icon={<BookOpen fill={theme.neutral1} />} color={theme.neutral1} label="Blog" />
              <H3>Insights and updates from the team</H3>
            </SquareCard>

            <RectCard backgroundColor={theme.neutral1}>
              <PillButton icon={<File fill={theme.neutral1} />} color={theme.neutral1} label="Newsletter" />
              <H3 color={theme.surface2}>
                Sign up for our newsletter to stay in touch with the latest updates, news, and events.
              </H3>
            </RectCard>
          </RowToCol>
        </SectionCol>
      </Box>
    </Box>
  )
}

const RowToCol = styled(Box)`
  height: auto;
  flex-shrink: 1;
  @media (max-width: 768px) {
    flex-direction: column;
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

type CardProps = {
  backgroundColor?: string
}

const Card = styled.div<CardProps>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  border-radius: 20px;
  padding: 32px 28px;
  overflow: hidden;
  background-color: ${(props) => props.backgroundColor || props.theme.surface2};
  @media (max-width: 768px) {
    padding: 24px;
  }
`

const SquareCard = motion(styled(Card)`
  width: 25%;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  @media (max-width: 768px) {
    width: 100%;
    aspect-ratio: initial;
    min-height: 240px;
  }
`)

const RectCard = motion(styled(Card)`
  width: 50%;
  aspect-ratio: 2 / 1;
  cursor: pointer;
  @media (max-width: 768px) {
    width: 100%;
    aspect-ratio: initial;
    min-height: 240px;
  }
`)
