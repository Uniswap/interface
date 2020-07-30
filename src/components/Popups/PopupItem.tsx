import React, { useCallback, useContext, useState } from 'react'
import { X } from 'react-feather'
import styled, { ThemeContext } from 'styled-components'
import useInterval from '../../hooks/useInterval'
import { PopupContent } from '../../state/application/actions'
import { useRemovePopup } from '../../state/application/hooks'
import ListUpdatePopup from './ListUpdatePopup'
import TransactionPopup from './TransactionPopup'

export const StyledClose = styled(X)`
  position: absolute;
  right: 10px;
  top: 10px;

  :hover {
    cursor: pointer;
  }
`
export const Popup = styled.div`
  display: inline-block;
  width: 100%;
  padding: 1em;
  background-color: ${({ theme }) => theme.bg1};
  position: relative;
  border-radius: 10px;
  padding: 20px;
  padding-right: 35px;
  z-index: 2;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 290px;
  `}
`
const DELAY = 100
const Fader = styled.div<{ count: number }>`
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: ${({ count }) => `calc(100% - (100% / ${150 / count}))`};
  height: 2px;
  background-color: ${({ theme }) => theme.bg3};
  transition: width 100ms linear;
`

export default function PopupItem({ content, popKey }: { content: PopupContent; popKey: string }) {
  const [count, setCount] = useState(1)

  const [isRunning, setIsRunning] = useState(true)
  const removePopup = useRemovePopup()

  const removeThisPopup = useCallback(() => removePopup(popKey), [popKey, removePopup])

  useInterval(
    () => {
      count > 150 ? removeThisPopup() : setCount(count + 1)
    },
    isRunning ? DELAY : null
  )

  const theme = useContext(ThemeContext)

  const handleMouseEnter = useCallback(() => setIsRunning(false), [])
  const handleMouseLeave = useCallback(() => setIsRunning(true), [])

  let popupContent
  if ('txn' in content) {
    const {
      txn: { hash, success, summary }
    } = content
    popupContent = <TransactionPopup hash={hash} success={success} summary={summary} />
  } else if ('listUpdate' in content) {
    const {
      listUpdate: { listUrl, oldList, newList, auto }
    } = content
    popupContent = <ListUpdatePopup popKey={popKey} listUrl={listUrl} oldList={oldList} newList={newList} auto={auto} />
  }

  return (
    <Popup onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <StyledClose color={theme.text2} onClick={() => removePopup(popKey)} />
      {popupContent}
      <Fader count={count} />
    </Popup>
  )
}
