import styled from 'styled-components'

import FlagEN from 'assets/images/flag-EN.svg'
import FlagKO from 'assets/images/flag-KO.svg'
import FlagTR from 'assets/images/flag-TR.svg'
import FlagVI from 'assets/images/flag-VI.svg'
import FlagZH from 'assets/images/flag-ZH.svg'

export const LOCALE_INFO = {
  'en-US': { flag: FlagEN, name: 'English' },
  'zh-CN': { flag: FlagZH, name: '中文' },
  'tr-TR': { flag: FlagTR, name: 'Türkçe' },
  'ko-KR': { flag: FlagKO, name: '한국어' },
  'vi-VN': { flag: FlagVI, name: 'Tiếng Việt' },
} as const

export type SupportedLocale = keyof typeof LOCALE_INFO
export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

const Flag = styled.img`
  width: 20px;
  vertical-align: middle;
`

export const getLocaleLabel = (locale: SupportedLocale | null, codeOnly = false) => {
  locale = locale || DEFAULT_LOCALE
  const { name, flag } = LOCALE_INFO[locale] || LOCALE_INFO[DEFAULT_LOCALE]
  return (
    <>
      <Flag src={flag} /> &nbsp;{codeOnly ? locale?.split('-')?.[0]?.toUpperCase() : name}
    </>
  )
}
