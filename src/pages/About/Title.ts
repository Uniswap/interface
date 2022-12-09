import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

export const Title = styled.h1<{ isDarkMode: boolean }>`
  color: transparent;
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 0px;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(20deg, rgb(255, 244, 207) 10%, rgb(255, 87, 218) 100%)'
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
  font-weight: 600;
  max-width: 340px;
  color: transparent;
  font-size: 36px;
  line-height: 44px;

  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(20deg, rgb(255, 244, 207) 10%, rgb(255, 87, 218) 100%)'
      : 'linear-gradient(10deg, rgb(255,79,184) 0%, rgb(255,159,251) 100%)'};

  background-clip: text;
  -webkit-background-clip: text;
`
