import React, { Dispatch, SetStateAction } from 'react'
import styled from 'styled-components'
import { t } from '@lingui/macro'
import SearchIcon from 'components/Icons/Search'
import useTheme from 'hooks/useTheme'

const Container = styled.div`
  z-index: 30;
  position: relative;

  @media screen and (max-width: 600px) {
    width: 100%;
  }
`

const Wrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.background};
  z-index: 9999;
  width: 100%;
  min-width: 300px;
  box-sizing: border-box;
  @media screen and (max-width: 500px) {
    box-shadow: none;
  }
`
const Input = styled.input`
  position: relative;
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  width: 100%;
  color: ${({ theme }) => theme.text};
  font-size: 12px;

  ::placeholder {
    color: ${({ theme }) => theme.text8};
    font-size: 12px;
  }
`

interface SearchProps {
  searchValue: string
  setSearchValue: Dispatch<SetStateAction<string>>
  placeholder?: string
}

export const Search = ({ searchValue, setSearchValue, placeholder }: SearchProps) => {
  const theme = useTheme()
  return (
    <Container>
      <Wrapper>
        <Input
          type="text"
          placeholder={placeholder || t`Search by pool address`}
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value)
          }}
        />
        <SearchIcon color={theme.subText} />
      </Wrapper>
    </Container>
  )
}

export default Search
