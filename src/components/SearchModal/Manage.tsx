import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { TokenList } from '@uniswap/token-lists'
import React, { useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { CloseIcon } from 'theme'

import { CurrencyModalView } from './CurrencySearchModal'
import { ManageLists } from './ManageLists'
import ManageTokens from './ManageTokens'
import { PaddedColumn, Separator } from './styleds'

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  padding-bottom: 80px;
`

const ToggleWrapper = styled(RowBetween)`
  background-color: ${({ theme }) => theme.tabBackgound};
  border-radius: 999px;
  padding: 4px;
`

const ToggleOption = styled.div<{ active?: boolean }>`
  width: 48%;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-weight: 500;
  background-color: ${({ theme, active }) => (active ? theme.tabActive : theme.tabBackgound)};
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  user-select: none;

  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

export default function Manage({
  onDismiss,
  setModalView,
  setImportList,
  setImportToken,
  setListUrl,
}: {
  onDismiss: () => void
  setModalView: (view: CurrencyModalView) => void
  setImportToken: (token: Token) => void
  setImportList: (list: TokenList) => void
  setListUrl: (url: string) => void
}) {
  // toggle between tokens and lists
  const [showLists, setShowLists] = useState(true)
  const { mixpanelHandler } = useMixpanel()
  return (
    <Wrapper>
      <PaddedColumn>
        <RowBetween>
          <ArrowLeft style={{ cursor: 'pointer' }} onClick={() => setModalView(CurrencyModalView.search)} />
          <Text fontWeight={500} fontSize={20}>
            <Trans>Manage</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <Separator />
      <PaddedColumn style={{ paddingBottom: 0 }}>
        <ToggleWrapper>
          <ToggleOption
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.MANAGE_TOKEN_LISTS_TAB_CLICK, { tab: 'List' })
              setShowLists(true)
            }}
            active={showLists}
          >
            <Trans>Lists</Trans>
          </ToggleOption>
          <ToggleOption
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.MANAGE_TOKEN_LISTS_TAB_CLICK, { tab: 'Token' })
              setShowLists(false)
            }}
            active={!showLists}
          >
            <Trans>Tokens</Trans>
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
