import React from 'react'
import { useHistory, useLocation } from 'react-router'
import styled from 'styled-components'
import { stringify } from 'qs'
import { Check } from 'react-feather'

import { LOCALE_LABEL, SupportedLocale } from 'constants/locales'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useUserLocale } from 'state/user/hooks'
import { ButtonEmpty } from 'components/Button'
import { ArrowLeft } from 'react-feather'
import useTheme from 'hooks/useTheme'

const StyledLanguageSelector = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
`

const OptionTitle = styled.div<{ isSelected?: boolean }>`
  color: ${({ theme, isSelected }) => (isSelected ? theme.primary : theme.subText)};
  font-size: 14px;
`

export default function LanguageSelector({
  setIsSelectingLanguage
}: {
  setIsSelectingLanguage: (isSelectingLanguage: boolean) => void
}) {
  const theme = useTheme()
  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString()
  const userLocale = useUserLocale()

  const handleSelectLanguage = (locale: SupportedLocale) => {
    const target = {
      ...location,
      search: stringify({ ...qs, lng: locale })
    }

    history.push(target)
    setIsSelectingLanguage(false)
  }

  return (
    <StyledLanguageSelector>
      <ButtonEmpty
        width="fit-content"
        padding="0"
        onClick={() => setIsSelectingLanguage(false)}
        style={{ textDecoration: 'none', color: theme.text, marginBottom: '24px' }}
      >
        <ArrowLeft />
      </ButtonEmpty>

      {Object.entries(LOCALE_LABEL).map(([locale, label], index) => {
        const isLastItem = index + 1 === Object.keys(LOCALE_LABEL).length

        return (
          <ButtonEmpty
            key={locale}
            padding="0"
            onClick={() => handleSelectLanguage(locale as SupportedLocale)}
            style={{
              textDecoration: 'none',
              marginBottom: isLastItem ? '0' : '16px',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <OptionTitle isSelected={locale === userLocale}>{label}</OptionTitle>

            {locale === userLocale && <Check color={theme.primary}></Check>}
          </ButtonEmpty>
        )
      })}
    </StyledLanguageSelector>
  )
}
