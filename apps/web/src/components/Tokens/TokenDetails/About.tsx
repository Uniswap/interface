import { deprecatedStyled } from 'lib/styled-components'
import { ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'

export const AboutContainer = deprecatedStyled.div`
  gap: 16px;
  padding: 24px 0px;
  ${textFadeIn}
`
export const AboutHeader = deprecatedStyled(ThemedText.MediumHeader)`
  font-size: 28px !important;
`
