import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import ThemeToggle from 'theme/components/ThemeToggle'

import { AnalyticsToggle } from './AnalyticsToggle'
import { GitVersionRow } from './GitVersionRow'
import { LanguageSelector } from './LanguageSelector'
import { SlideOutMenu } from './SlideOutMenu'
import { SmallBalanceToggle } from './SmallBalanceToggle'
import { TestnetsToggle } from './TestnetsToggle'

const SectionTitle = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.textSecondary};
  padding-bottom: 24px;
  display: flex;
  justify-content: space-between;
`

const ToggleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`

export default function SettingsMenu({ onClose }: { onClose: () => void }) {
  return (
    <SlideOutMenu title={<Trans>Settings</Trans>} onClose={onClose}>
      <SectionTitle>
        <Trans>Preferences</Trans>
      </SectionTitle>
      <ToggleWrapper>
        <ThemeToggle />
        <SmallBalanceToggle />
        <AnalyticsToggle />
        <TestnetsToggle />
      </ToggleWrapper>
      <LanguageSelector />
      <GitVersionRow />
    </SlideOutMenu>
  )
}
