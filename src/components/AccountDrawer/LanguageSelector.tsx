import { t, Trans } from '@lingui/macro'
import { ChangeEvent, Fragment, useState } from 'react'
import { Check } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'

import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from '../../constants/locales'
import { useActiveLocale } from '../../hooks/useActiveLocale'
import { useLocationLinkProps } from '../../hooks/useLocationLinkProps'
import { ClickableStyle, ThemedText } from '../../theme'

const SectionTitle = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.textSecondary};
  padding-bottom: 24px;
  display: flex;
  justify-content: space-between;
`

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

const SearchBox = styled.input`
  padding: 4px 6px;
  border-radius: 6px;
  backdrop-filter: blur(60px);
  background: transparent;
  width: 60%;

  background-color: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.backgroundInteractive};

  ::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
  :-ms-input-placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
  ::-ms-input-placeholder {
    color: ${(props) => props.theme.textSecondary};
  }

  &:focus-visible {
    outline: none;
  }
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

export function LanguageSelector() {
  const [search, setSearch] = useState('')

  const activeLocale = useActiveLocale()

  const handleInputChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setSearch(ev.target.value)
  }

  const filteredLocales = SUPPORTED_LOCALES.filter((locale) =>
    LOCALE_LABEL[locale].toLowerCase().includes(search.toLocaleLowerCase())
  )

  return (
    <Fragment>
      <SectionTitle data-testid="wallet-header">
        <Trans>Language</Trans>
        <SearchBox type="text" onChange={handleInputChange} placeholder={t`Search`} value={search} />
      </SectionTitle>
      {filteredLocales.map((locale) => (
        <LanguageMenuItem locale={locale} isActive={activeLocale === locale} key={locale} />
      ))}
    </Fragment>
  )
}
