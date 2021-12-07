import React, { useMemo } from 'react'
import { useLocation } from 'react-router'
import styled from 'styled-components'
import { stringify } from 'qs'

import { DEFAULT_LOCALE, LOCALE_LABEL, SupportedLocale } from 'constants/locales'
import { navigatorLocale, useActiveLocale } from 'hooks/useActiveLocale'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { StyledInternalLink, TYPE } from 'theme'

const Container = styled(TYPE.small)`
  opacity: 0.6;
  :hover {
    opacity: 1;
  }
  margin-top: 1rem !important;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `};
`

export function SwitchLocaleLink() {
  const activeLocale = useActiveLocale()
  const browserLocale = useMemo(() => navigatorLocale(), [])
  const location = useLocation()
  const qs = useParsedQueryString()

  if (browserLocale && (browserLocale !== DEFAULT_LOCALE || activeLocale !== DEFAULT_LOCALE)) {
    let targetLocale: SupportedLocale
    if (activeLocale === browserLocale) {
      targetLocale = DEFAULT_LOCALE
    } else {
      targetLocale = browserLocale
    }

    const target = {
      ...location,
      search: stringify({ ...qs, lng: targetLocale })
    }

    return (
      <Container>
        KyberSwap available in: {<StyledInternalLink to={target}>{LOCALE_LABEL[targetLocale]}</StyledInternalLink>}
      </Container>
    )
  }

  return null
}
