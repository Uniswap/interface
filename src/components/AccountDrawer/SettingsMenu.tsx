import { Trans } from '@lingui/macro'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { Check } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme'
import ThemeToggle from 'theme/components/ThemeToggle'

import { AnalyticsToggle } from './AnalyticsToggle'
import { GitVersionRow } from './GitVersionRow'
import { SlideOutMenu } from './SlideOutMenu'
import { SmallBalanceToggle } from './SmallBalanceToggle'
import { TestnetsToggle } from './TestnetsToggle'

const InternalLinkMenuItem = styled(Link)`
  ${ClickableStyle}
  flex: 1;
  color: ${({ theme }) => theme.textTertiary};
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
`

function LanguageMenuItem({ locale, isActive }: { locale: SupportedLocale; isActive: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)
  const theme = useTheme()

  if (!to) return null

  return (
    <InternalLinkMenuItem onClick={onClick} to={to}>
      <ThemedText.BodySmall data-testid="wallet-language-item">{LOCALE_LABEL[locale]}</ThemedText.BodySmall>
      {isActive && <Check color={theme.accentActive} opacity={1} size={20} />}
    </InternalLinkMenuItem>
  )
}

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

export default function SettingsMenu({ onClose }: { onClose: () => void }) {
  const activeLocale = useActiveLocale()

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

      <SectionTitle data-testid="wallet-header">
        <Trans>Language</Trans>
      </SectionTitle>
      {SUPPORTED_LOCALES.map((locale) => (
        <LanguageMenuItem locale={locale} isActive={activeLocale === locale} key={locale} />
      ))}
      <GitVersionRow />
    </SlideOutMenu>
  )
}
