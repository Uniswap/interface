import React, { useCallback, useState } from 'react'
import { RowBetween } from '../Row'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { Token } from '@swapr/sdk'
import { ManageLists } from './ManageLists'
import ManageTokens from './ManageTokens'
import { TokenList } from '@uniswap/token-lists'
import { CurrencyModalView } from './CurrencySearchModal'
import { CloseIcon } from '../../theme'
import { useMeasure } from 'react-use'
import { animated, useSpring } from '@react-spring/web'
import { GoBackIcon } from './styleds'

const Wrapper = styled(Flex)`
  width: 100%;
  background-color: ${({ theme }) => theme.bg1And2};
  flex-direction: column;
`

const ToggleWrapper = styled(RowBetween)`
  position: relative;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 12px;
  padding: 6px;
`

const TabContainer = styled.div`
  display: flex;
  overflow: hidden;
`

const Slide = styled.div`
  width: 100%;
  flex-shrink: 0;
`
const AnimatedSlide = animated(Slide)

const ToggleOption = styled.button<{ active: boolean }>`
  width: 48%;
  background-color: transparent;
  border: none;
  outline: none;
  padding: 10px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: 600;
  color: ${({ theme, active }) => (active ? theme.text1 : theme.text2)};
  user-select: none;
  :hover {
    cursor: pointer;
  }
`

const ToggleIndicator = styled.div`
  width: 48%;
  height: calc(100% - 12px);
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bg1And2};
  position: absolute;
`
const AnimatedToggleIndicator = animated(ToggleIndicator)

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
  const [showLists, setShowLists] = useState(true)

  const [ref, { width }] = useMeasure()
  const [styles, api] = useSpring({ x: 0 }, [width])
  const [tabIndicatorStyles, tabIndicatorApi] = useSpring(() => ({ x: '0%' }))

  const handleListsClick = useCallback(() => {
    setShowLists(true)
    tabIndicatorApi.start({ x: '0%' })
    api.start({ x: 0 })
  }, [api, tabIndicatorApi])

  const handleTokensClick = useCallback(() => {
    setShowLists(false)
    tabIndicatorApi.start({ x: '100%' })
    api.start({ x: -width })
  }, [api, width, tabIndicatorApi])

  return (
    <Wrapper ref={ref}>
      <Box p="20px">
        <RowBetween>
          <GoBackIcon onClick={() => setModalView(CurrencyModalView.SEARCH)} />
          <Text fontWeight={500} fontSize={16}>
            Select a {showLists ? 'list' : 'token'}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </Box>
      <Box px="20px">
        <ToggleWrapper>
          <AnimatedToggleIndicator style={tabIndicatorStyles} />
          <ToggleOption onClick={handleListsClick} active={showLists}>
            Lists
          </ToggleOption>
          <ToggleOption onClick={handleTokensClick} active={!showLists}>
            Tokens
          </ToggleOption>
        </ToggleWrapper>
      </Box>
      <TabContainer>
        <AnimatedSlide style={styles}>
          <ManageLists setModalView={setModalView} setImportList={setImportList} setListUrl={setListUrl} />
        </AnimatedSlide>
        <AnimatedSlide style={styles}>
          <ManageTokens setModalView={setModalView} setImportToken={setImportToken} />
        </AnimatedSlide>
      </TabContainer>
    </Wrapper>
  )
}
