import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'

export const DesktopTextBreak = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    display: block;
  }
`
