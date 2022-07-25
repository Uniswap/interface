import React from 'react'
import { Search } from 'react-feather'
import styled from 'styled-components'
import { t } from '@lingui/macro'

type Props = {
  text: string
  setText: (txt: string) => void
}

const SearchBarWrapper = styled.div`
  width: 100%;
  height: 36px;
  position: relative;
`

const Input = styled.input`
  width: 100%;
  height: 100%;

  padding: 8px 36px 8px 12px;

  background: ${({ theme }) => theme.buttonBlack};
  border: 0px;
  border-radius: 40px;
  color: inherit;
  outline: none;

  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`

const IconWrapper = styled.div`
  position: absolute;
  right: 12px;
  top: 0;

  width: 18px;
  height: 100%;

  display: flex;
  align-items: center;

  color: ${({ theme }) => theme.subText};
`

const SearchBar: React.FC<Props> = ({ text, setText }) => {
  return (
    <SearchBarWrapper>
      <Input value={text} onChange={e => setText(e.target.value)} placeholder={t`Search for a liquidity source`} />
      <IconWrapper>
        <Search />
      </IconWrapper>
    </SearchBarWrapper>
  )
}

export default SearchBar
