import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'

export const AboutContainer = styled.div`
  gap: 16px;
  padding: 24px 0px;
  ${textFadeIn}
`
export const AboutHeader = styled(ThemedText.MediumHeader)`
  font-size: 28px !important;
`
