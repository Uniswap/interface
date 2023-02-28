import styled from 'styled-components/macro'
import { darkTheme } from 'theme/colors'

export const PageButtons = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.2em;
  margin-bottom: 0.5em;
`

export const Arrow = styled.div<{ faded: boolean }>`
  color: ${darkTheme.textPrimary};
  opacity: ${1};
  padding: 0 20px;
  user-select: none;
  :hover {
    cursor: pointer;
  }
`

export const Break = styled.div`
  height: 1px;
  background-color: ${darkTheme.background};
  width: 100%;
`
