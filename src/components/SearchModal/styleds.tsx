import { Search } from 'react-feather'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'

export const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
  padding-bottom: 12px;
`

export const SearchWrapper = styled.div`
  position: relative;
  height: 45px;
`

export const SearchIcon = styled(Search)`
  position: absolute;
  right: 12px;
  top: 12px;
`

export const SearchInput = styled.input`
  position: absolute;
  display: flex;
  padding: 10px 30px 13px 16px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  border-radius: 999px;
  color: ${({ theme }) => theme.text};
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.buttonBlack};
  background: ${({ theme }) => theme.buttonBlack};
  -webkit-appearance: none;

  font-size: 17px;

  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 13.5px;
    ${({ theme }) => theme.mediaWidth.upToSmall`
      font-size: 12.5px;
    `};
  }
  transition: border 100ms;
  :focus {
    border: 1px solid ${({ theme }) => theme.primary};
    outline: none;
  }
`
export const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.border};
`
