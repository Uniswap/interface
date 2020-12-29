import React, { useState } from 'react'
import { PaddedColumn, Separator } from './styleds'
import { RowBetween } from 'components/Row'
import { ArrowLeft } from 'react-feather'
import { Text } from 'rebass'
import { CloseIcon } from 'theme'
import styled from 'styled-components'
import { Token } from '@uniswap/sdk'
import { ManageLists } from './ManageLists'
import ManageTokens from './ManageTokens'

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  padding-bottom: 80px;
`

const ToggleWrapper = styled(RowBetween)`
  background-color: ${({ theme }) => theme.bg3};
  border-radius: 12px;
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
  background-color: ${({ theme, active }) => (active ? theme.bg1 : theme.bg3)};
  color: ${({ theme, active }) => (active ? theme.text1 : theme.text2)};

  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

export default function Manage({
  onDismiss,
  onBack,
  showImportView,
  setImportToken
}: {
  onDismiss: () => void
  onBack: () => void
  showImportView: () => void
  setImportToken: (token: Token) => void
}) {
  // toggle between tokens and lists
  const [showLists, setShowLists] = useState(false)

  return (
    <Wrapper>
      <PaddedColumn>
        <RowBetween>
          <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} />
          <Text fontWeight={500} fontSize={20}>
            Manage
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <Separator />
      <PaddedColumn style={{ paddingBottom: 0 }}>
        <ToggleWrapper>
          <ToggleOption onClick={() => setShowLists(!showLists)} active={!showLists}>
            Tokens
          </ToggleOption>
          <ToggleOption onClick={() => setShowLists(!showLists)} active={showLists}>
            Lists
          </ToggleOption>
        </ToggleWrapper>
      </PaddedColumn>
      {showLists ? (
        <ManageLists onBack={onBack} />
      ) : (
        <ManageTokens showImportView={showImportView} setImportToken={setImportToken} />
      )}
    </Wrapper>
  )
}
