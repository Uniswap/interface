import React from 'react'
import FlagEN from '../assets/images/flag-EN.svg'
import FlagZH from '../assets/images/flag-ZH.svg'
import FlagTR from '../assets/images/flag-TR.svg'
import FlagKO from '../assets/images/flag-KO.svg'
import FlagVI from '../assets/images/flag-VI.svg'
import styled from 'styled-components'

export const SUPPORTED_LOCALES = ['en-US', 'ko-KR', 'tr-TR', 'vi-VN', 'zh-CN'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

const Flag = styled.img`
  width: 20px;
  vertical-align: middle;
`

export const LOCALE_LABEL: { [locale in SupportedLocale]: JSX.Element } = {
  'en-US': (
    <>
      <Flag src={FlagEN} /> &nbsp;English
    </>
  ),
  'zh-CN': (
    <>
      <Flag src={FlagZH} /> &nbsp;中文
    </>
  ),
  'tr-TR': (
    <>
      <Flag src={FlagTR} /> &nbsp;Türkçe
    </>
  ),
  'ko-KR': (
    <>
      <Flag src={FlagKO} /> &nbsp;한국어
    </>
  ),
  'vi-VN': (
    <>
      <Flag src={FlagVI} /> &nbsp;Tiếng Việt
    </>
  )
}
