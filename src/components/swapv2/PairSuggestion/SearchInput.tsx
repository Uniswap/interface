import { t } from '@lingui/macro'
import React, { RefObject, forwardRef } from 'react'
import { BrowserView, isMacOs, isMobile } from 'react-device-detect'
import { Command, Search } from 'react-feather'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

const SearchWrapper = styled.div<{ showList: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  position: relative;
  width: 100%;
  border-radius: 20px;
  background-color: ${({ theme, showList }) => (showList ? theme.tabActive : theme.background)};
  height: 45px;
`
const SearchInput = styled.input<{ hasBorder?: boolean }>`
  ::placeholder {
    color: ${({ theme }) => theme.border};
  }
  transition: border 100ms;
  color: ${({ theme }) => theme.text};
  background: none;
  border: none;
  outline: none;
  padding: 16px;
  padding-left: 35px;
  width: 100%;
  font-size: 16px;
  ${({ theme, hasBorder }) =>
    hasBorder
      ? css`
          border-radius: 20px;
          border: 1px solid ${theme.primary};
        `
      : css`
          border: none;
        `};
`

const DisabledFrame = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`

const SearchIcon = styled(Search)<{ $showList: boolean }>`
  position: absolute;
  left: 10px;
  color: ${({ theme, $showList }) => ($showList ? theme.subText : theme.border)};
  font-size: 14px;
`
const InputIcon = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  padding: 3px 8px;
  margin-right: 10px;
  border-radius: 22px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
`

type Props = {
  value: string
  isShowListPair: boolean
  disabled?: boolean
  ref: RefObject<HTMLInputElement>
  hasBorder?: boolean
  showListView: () => void
  hideListView: () => void
  onChangeInput: (value: string) => void
  onKeyPressInput: (e: React.KeyboardEvent) => void
}

export default forwardRef<HTMLInputElement, Props>(function SearchComponent(
  { isShowListPair, hasBorder, disabled, value, onChangeInput, onKeyPressInput, showListView, hideListView },
  ref,
) {
  const onChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget
    onChangeInput(value)
  }

  const onBlurInput = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isMobile) return
    const relate = e.relatedTarget as HTMLDivElement
    if (relate && relate.classList.contains('no-blur')) {
      return // press star / import icon
    }
    hideListView()
  }

  const { mixpanelHandler } = useMixpanel()

  const showListViewWithTracking = () => {
    showListView()
    mixpanelHandler(MIXPANEL_TYPE.TAS_PRESS_CTRL_K, 'mouse click')
  }

  return (
    <SearchWrapper showList={isShowListPair}>
      <SearchIcon size={18} $showList={isShowListPair} />
      <SearchInput
        ref={ref}
        hasBorder={hasBorder}
        onBlur={onBlurInput}
        onFocus={disabled ? undefined : showListViewWithTracking}
        placeholder={t`You can try "10 ETH to KNC"`}
        value={value}
        onChange={onChange}
        autoComplete="off"
        onKeyDown={onKeyPressInput}
      />
      {disabled && <DisabledFrame onClick={showListViewWithTracking} />}
      <BrowserView>
        {isShowListPair ? (
          <InputIcon onClick={hideListView} key={1}>
            Esc
          </InputIcon>
        ) : (
          <InputIcon onClick={showListView} key={2}>
            <Flex>
              {isMacOs ? (
                <>
                  <Command size={13} /> <span style={{ marginLeft: 3 }}>K</span>
                </>
              ) : (
                <span style={{ whiteSpace: 'nowrap' }}>Ctrl+K</span>
              )}
            </Flex>
          </InputIcon>
        )}
      </BrowserView>
    </SearchWrapper>
  )
})
