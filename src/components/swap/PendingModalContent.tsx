import { ColumnCenter } from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import { ReactNode } from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme/components/text'

interface PendingModalContentProps {
  title: ReactNode
  subtitle: ReactNode
  label: ReactNode
  tooltipText?: ReactNode
  logo: ReactNode
}

const Container = styled(ColumnCenter)`
  margin: 48px 0 76px;
`

const LogoContainer = styled.div`
  position: relative;
  display: flex;
  border-radius: 50%;
  overflow: visible;
`

const LogoLayer = styled.div`
  z-index: 2;
`

// TODO: switch to LoaderV2 with updated API to support changing color and size.
const LoadingIndicator = styled(Loader)`
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  top: -4px;
  left: -4px;
  position: absolute;
`

export function PendingModalContent({ title, subtitle, label, tooltipText, logo }: PendingModalContentProps) {
  const theme = useTheme()
  return (
    <Container gap="lg">
      <LogoContainer>
        <LogoLayer>{logo}</LogoLayer>
        <LoadingIndicator stroke={theme.textTertiary} />
      </LogoContainer>
      <ColumnCenter gap="md">
        <ThemedText.HeadlineSmall>{title}</ThemedText.HeadlineSmall>
        <ThemedText.LabelSmall>{subtitle}</ThemedText.LabelSmall>
        <Row justify="center">
          <ThemedText.Caption color="textSecondary">{label}</ThemedText.Caption>
          <QuestionHelper text={tooltipText} />
        </Row>
      </ColumnCenter>
    </Container>
  )
}
