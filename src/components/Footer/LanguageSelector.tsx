import React from 'react'
import { useHistory, useLocation } from 'react-router'
import styled from 'styled-components'
import { Select } from '@rebass/forms'
import { stringify } from 'qs'

import { LOCALE_LABEL } from 'constants/locales'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useUserLocale } from 'state/user/hooks'

const StyledLanguageSelector = styled.div`
  display: flex;
  align-items: center;
  margin-left: 8px;
  padding: 6px 9px 6px 10px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.bg13};
`

export default function LanguageSelector() {
  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString()
  const userLocale = useUserLocale()

  const handleSelectLanguage = (event: any) => {
    event.preventDefault()

    const target = {
      ...location,
      search: stringify({ ...qs, lng: event.target.value })
    }

    history.push(target)
  }

  return (
    <StyledLanguageSelector>
      <Select
        id="language-selector"
        name="language"
        value={userLocale as string}
        defaultValue={LOCALE_LABEL['en-US']}
        sx={{
          border: 'none',
          width: 'fit-content',
          padding: '2px 28px 2px 2px'
        }}
        onChange={handleSelectLanguage}
      >
        {Object.entries(LOCALE_LABEL).map(([locale, label]) => (
          <option key={locale} value={locale}>
            {label}
          </option>
        ))}
      </Select>
    </StyledLanguageSelector>
  )
}
