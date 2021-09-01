import React, { Dispatch, SetStateAction } from 'react'
import styled from 'styled-components'
import { Search as SearchIcon } from 'react-feather'
import { t } from '@lingui/macro'

const Container = styled.div`
  z-index: 30;
  position: relative;
  margin-right: 12px;

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
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg11};
  z-index: 9999;
  width: 100%;
  min-width: 300px;
  box-sizing: border-box;
  box-shadow: 0px 24px 32px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04),
    0px 0px 1px rgba(0, 0, 0, 0.04);
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
  color: ${({ theme }) => theme.text1};
  font-size: 12px;

  ::placeholder {
    color: ${({ theme }) => theme.text8};
    font-size: 12px;
  }
`

const SearchIconLarge = styled(SearchIcon)`
  height: 20px;
  width: 20px;
  margin-right: 0.5rem;
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: ${({ theme }) => theme.text9};
`

interface SearchProps {
  searchValue: string
  setSearchValue: Dispatch<SetStateAction<string>>
}

export const Search = ({ searchValue, setSearchValue }: SearchProps) => {
  return (
    <Container>
      <Wrapper>
        <Input
          type="text"
          placeholder={t`Search by pool address`}
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value)
          }}
        />
        <SearchIconLarge />
      </Wrapper>
    </Container>
  )
}

export default Search
