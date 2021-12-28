import React, { useCallback, useContext, useEffect } from 'react'
import { X } from 'react-feather'
import { useSpring } from 'react-spring/web'
import styled, { keyframes, ThemeContext } from 'styled-components'
import { animated } from 'react-spring'
import { PopupContent } from 'state/application/actions'
import { useRemovePopup } from 'state/application/hooks'
import ListUpdatePopup from './ListUpdatePopup'
import TransactionPopup from './TransactionPopup'
import { HideSmall } from 'theme/components'

export const StyledClose = styled(X)`
  position: absolute;
  right: 10px;
  top: 10px;

  :hover {
    cursor: pointer;
  }
`

const rtl = keyframes`
  from {
    opacity: 0;
    transform: translateX(1000px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const ltr = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0;
    transform: translateX(1000px);
  }
`

export const Popup = styled.div<{ success?: boolean }>`
  display: inline-block;
  width: 100%;
  background: ${({ theme, success }) => (success ? theme.bg21 : theme.bg22)};
  position: relative;
  padding: 20px;
  padding-right: 36px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px;
    padding-right: 24px;
  `}
`

const Fader = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: ${({ theme }) => theme.subText};
`

const AnimatedFader = animated(Fader)

const PopupWrapper = styled.div`
  position: relative;
  isolation: isolate;
  border-radius: 10px;
  overflow: hidden;
  animation: ${rtl} 1.5s ease-in-out, ${ltr} 1.5s ease-in-out 14.15s;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: min(calc(100vw - 32px), 425px);
    
    &:not(:first-of-type) {
      margin-top: 10px;
    }
  `}
`

const SolidBackgroundLayer = styled.div`
  background: ${({ theme }) => theme.bg2};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

export default function PopupItem({
  removeAfterMs,
  content,
  popKey
}: {
  removeAfterMs: number | null
  content: PopupContent
  popKey: string
}) {
  const removePopup = useRemovePopup()
  const removeThisPopup = useCallback(() => removePopup(popKey), [popKey, removePopup])
  useEffect(() => {
    if (removeAfterMs === null) return undefined

    const timeout = setTimeout(() => {
      removeThisPopup()
    }, removeAfterMs)

    return () => {
      clearTimeout(timeout)
    }
  }, [removeAfterMs, removeThisPopup])

  const theme = useContext(ThemeContext)

  let popupContent
  if ('txn' in content) {
    const {
      txn: { hash, success, type, summary }
    } = content
    popupContent = <TransactionPopup hash={hash} success={success} type={type} summary={summary} />
  } else if ('listUpdate' in content) {
    const {
      listUpdate: { listUrl, oldList, newList, auto }
    } = content
    popupContent = <ListUpdatePopup popKey={popKey} listUrl={listUrl} oldList={oldList} newList={newList} auto={auto} />
  }

  const faderStyle = useSpring({
    from: { width: '100%' },
    to: { width: '0%' },
    config: { duration: removeAfterMs ?? undefined }
  })

  return (
    <PopupWrapper>
      <SolidBackgroundLayer />
      <Popup success={'txn' in content ? content.txn.success : true}>
        <StyledClose color={theme.text2} onClick={removeThisPopup} />
        {popupContent}
        {removeAfterMs !== null ? <AnimatedFader style={faderStyle} /> : null}
      </Popup>
    </PopupWrapper>
  )
}
