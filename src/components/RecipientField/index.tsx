import React, { useState } from 'react'
import { Flex } from 'rebass/styled-components'
import styled from 'styled-components'
import { SearchInput } from '../SearchModal/styleds'
import { RowBetween } from '../Row'
import { CloseIcon, TYPE } from '../../theme'

const AddReceipientButtonStyled = styled.button`
  font-size: 11px;
  line-height: 13px;
  letter-spacing: 0.08em;
  cursor: pointer;
  color: ${({ theme }) => theme.text4};
  outline: none;
  background: transparent;
  border: none;
`
const CloseIconStyled = styled(CloseIcon)`
  padding: 0;
`

const SearchInputStyled = styled(SearchInput)`
  margin-top: 5px;
`

export const RecipientField = () => {
  const [showInput, setShowInput] = useState(false)

  return !showInput ? (
    <Flex justifyContent="center">
      <AddReceipientButtonStyled onClick={() => setShowInput(true)}>Add receipient</AddReceipientButtonStyled>
    </Flex>
  ) : (
    <div>
      <RowBetween>
        <TYPE.subHeader px={2}>Select a pair</TYPE.subHeader>
        <CloseIconStyled p={0} onClick={() => setShowInput(false)} />
      </RowBetween>
      <SearchInputStyled type="text" placeholder={'Wallet address or ENS name'} />
    </div>
  )
}
