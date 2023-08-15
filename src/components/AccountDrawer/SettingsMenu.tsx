import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { LOCALE_LABEL } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import styled from 'styled-components'
import { ThemedText } from 'theme'
import ThemeToggle from 'theme/components/ThemeToggle'

import { AnalyticsToggle } from './AnalyticsToggle'
import { GitVersionRow } from './GitVersionRow'
import { SlideOutMenu } from './SlideOutMenu'
import { SmallBalanceToggle } from './SmallBalanceToggle'
import { TestnetsToggle } from './TestnetsToggle'

const Container = styled(Column)`
  height: 100%;
  justify-content: space-between;
`

const SectionTitle = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.textSecondary};
  padding-bottom: 24px;
`

const ToggleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`

const SettingsButtonWrapper = styled(Row)`
  cursor: pointer;
`

const StyledChevron = styled(ChevronRight)`
  color: ${({ theme }) => theme.textSecondary};
`

const SettingsButton = ({
  title,
  currentState,
  onClick,
}: {
  title: ReactNode
  currentState: ReactNode
  onClick: () => void
}) => (
  <SettingsButtonWrapper align="center" justify="space-between" onClick={onClick}>
    <ThemedText.SubHeaderSmall color="textPrimary">{title}</ThemedText.SubHeaderSmall>
    <Row gap="xs" align="center" width="min-content">
      <ThemedText.LabelMedium color="textPrimary">{currentState}</ThemedText.LabelMedium>
      <StyledChevron size={20} />
    </Row>
  </SettingsButtonWrapper>
)

export default function SettingsMenu({
  onClose,
  openLanguageSettings,
}: {
  onClose: () => void
  openLanguageSettings: () => void
}) {
  const activeLocale = useActiveLocale()

  return (
    <SlideOutMenu title={<Trans>Settings</Trans>} onClose={onClose}>
      <Container>
        <div>
          <SectionTitle data-testid="wallet-header">
            <Trans>Preferences</Trans>
          </SectionTitle>
          <ToggleWrapper>
            <ThemeToggle />
            <SmallBalanceToggle />
            <AnalyticsToggle />
            <TestnetsToggle />
          </ToggleWrapper>

          <SettingsButton
            title={<Trans>Language</Trans>}
            currentState={LOCALE_LABEL[activeLocale]}
            onClick={openLanguageSettings}
          />
        </div>
        <GitVersionRow />
      </Container>
    </SlideOutMenu>
  )
}
