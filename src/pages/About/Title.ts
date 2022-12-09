import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

export const Title = styled.h1<{ isDarkMode: boolean }>`
  color: transparent;
  font-size: 48px;
  font-weight: 500;
  margin-bottom: 0px;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'conic-gradient(from 180deg at 50% 50%, #FFF4CF 0deg, #EBFFBF 95.62deg, #E3CDFF 175.81deg, #FFCDF4 269.07deg, #FFFBEF 360deg);'
      : 'linear-gradient(10deg, rgb(255,79,184) 0%, rgb(255,159,251) 100%)'};

  background-clip: text;
  -webkit-background-clip: text;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 64px;
    line-height: 72px;
  }
`

export const SubTitle = styled.h2<{ isDarkMode?: boolean }>`
  margin: 0;
  font-weight: 500;
  max-width: 340px;
  color: transparent;
  font-size: 36px;
  line-height: 44px;

  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'conic-gradient(from 180deg at 50% 50%, #FFF4CF 0deg, #EBFFBF 95.62deg, #E3CDFF 175.81deg, #FFCDF4 269.07deg, #FFFBEF 360deg);'
      : 'linear-gradient(10deg, rgb(255,79,184) 0%, rgb(255,159,251) 100%)'};

  background-clip: text;
  -webkit-background-clip: text;
`
