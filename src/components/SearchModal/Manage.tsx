import React, { useState } from 'react'
import { PaddedColumn, Separator } from './styleds'
import { RowBetween } from '../Row'
import { ChevronLeft } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'
import { Token } from 'dxswap-sdk'
import { ManageLists } from './ManageLists'
import ManageTokens from './ManageTokens'
import { TokenList } from '@uniswap/token-lists'
import { CurrencyModalView } from './CurrencySearchModal'
import { CloseIcon } from '../../theme'

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  padding-bottom: 80px;
  background-color: ${({ theme }) => theme.bg1And2};
`

const ToggleWrapper = styled(RowBetween)`
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 8px;
  padding: 6px;
`

const ToggleOption = styled.div<{ active?: boolean }>`
  width: 48%;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: 600;
  background-color: ${({ theme, active }) => (active ? theme.bg1And2 : theme.bg2)};
  color: ${({ theme, active }) => (active ? theme.text1 : theme.text2)};
  user-select: none;
  :hover {
    cursor: pointer;
  }
`

const GoBackIcon = styled(ChevronLeft)<{ onClick: () => void }>`
  color: ${({ theme }) => theme.purple3};
  width: 16px;
  height: 16px;
  cursor: pointer;
`

export default function Manage({
  onDismiss,
  setModalView,
  setImportList,
  setImportToken,
  setListUrl
}: {
  onDismiss: () => void
  setModalView: (view: CurrencyModalView) => void
  setImportToken: (token: Token) => void
  setImportList: (list: TokenList) => void
  setListUrl: (url: string) => void
}) {
  // toggle between tokens and lists
  const [showLists, setShowLists] = useState(true)

  return (
    <Wrapper>
      <PaddedColumn>
        <RowBetween>
          <GoBackIcon onClick={() => setModalView(CurrencyModalView.SEARCH)} />
          <Text fontWeight={500} fontSize={16}>
            Select a {showLists ? 'list' : 'token'}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <Separator />
      <PaddedColumn style={{ paddingBottom: 0 }}>
        <ToggleWrapper>
          <ToggleOption onClick={() => setShowLists(true)} active={showLists}>
            Lists
          </ToggleOption>
          <ToggleOption onClick={() => setShowLists(false)} active={!showLists}>
            Tokens
          </ToggleOption>
        </ToggleWrapper>
      </PaddedColumn>
      {showLists ? (
        <ManageLists setModalView={setModalView} setImportList={setImportList} setListUrl={setListUrl} />
      ) : (
        <ManageTokens setModalView={setModalView} setImportToken={setImportToken} />
      )}
    </Wrapper>
  )
}
