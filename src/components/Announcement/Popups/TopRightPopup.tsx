import { rgba } from 'polished'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'
import { animated, useSpring } from 'react-spring'
import { Flex } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import { NotificationType, PopupContentSimple, PopupContentTxn, PopupType } from 'components/Announcement/type'
import useTheme from 'hooks/useTheme'
import { useRemovePopup } from 'state/application/hooks'
import { PopupItemType } from 'state/application/reducer'

import SimplePopup from './SimplePopup'
import TransactionPopup from './TransactionPopup'
import getPopupTopRightDescriptionByType from './getPopupTopRightDescriptionByType'

const StyledClose = styled(X)`
  margin-left: 10px;
  min-width: 24px;
  :hover {
    cursor: pointer;
  }
`
const delta = window.innerWidth + 'px'

const rtl = keyframes`
  from {
    opacity: 0;
    transform: translateX(${delta});
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
    transform: translateX(${delta});
  }
`

const getBackgroundColor = (theme: DefaultTheme, type: NotificationType = NotificationType.ERROR) => {
  const mapColor = {
    [NotificationType.SUCCESS]: theme.bg21,
    [NotificationType.ERROR]: theme.bg22,
    [NotificationType.WARNING]: theme.bg23,
  }
  return mapColor[type]
}

const Popup = styled.div<{ type?: NotificationType }>`
  display: inline-block;
  width: 100%;
  background: ${({ theme, type }) => getBackgroundColor(theme, type)};
  position: relative;
  padding: 20px;
  padding-right: 12px;
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

const PopupWrapper = styled.div<{ removeAfterMs?: number | null }>`
  position: relative;
  isolation: isolate;
  border-radius: 10px;
  overflow: hidden;
  width: min(calc(100vw - 32px), 425px);
  animation: ${rtl} 0.7s ease-in-out,
    ${ltr} 0.5s ease-in-out ${({ removeAfterMs }) => (removeAfterMs || 15000) / 1000 - 0.2}s; // animation out auto play after removeAfterMs - 0.2 seconds
  &:not(:first-of-type) {
    margin-top: 15px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: auto;
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

const WrappedAnimatedFader = ({ removeAfterMs }: { removeAfterMs: number | null }) => {
  const faderStyle = useSpring({
    from: { width: '100%' },
    to: { width: '0%' },
    config: { duration: removeAfterMs ?? undefined },
  })

  return <AnimatedFader style={faderStyle} />
}

const Overlay = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) =>
    `linear-gradient(180deg, ${rgba(theme.darkMode ? theme.black : theme.white, 0)} 40.1%, ${rgba(
      theme.darkMode ? theme.black : theme.white,
      0.8,
    )} 100%)`};
`

export default function PopupItem({ popup, hasOverlay }: { popup: PopupItemType; hasOverlay: boolean }) {
  const { removeAfterMs, popupType, content } = popup

  const [isRestartAnimation, setRestartAnimation] = useState(false)
  const removePopup = useRemovePopup()
  const removeThisPopup = useCallback(() => removePopup(popup), [popup, removePopup])
  useEffect(() => {
    if (removeAfterMs === null) return
    const timeout = setTimeout(() => {
      removeThisPopup()
    }, removeAfterMs)
    requestAnimationFrame(() => setRestartAnimation(false))

    return () => {
      clearTimeout(timeout)
      setRestartAnimation(true)
    }
  }, [removeAfterMs, removeThisPopup, content])

  const theme = useTheme()

  let notiType = NotificationType.SUCCESS
  let popupContent
  switch (popupType) {
    case PopupType.SIMPLE: {
      const { title, summary, type = NotificationType.ERROR, icon } = content as PopupContentSimple
      notiType = type
      popupContent = <SimplePopup title={title} type={type} summary={summary} icon={icon} />
      break
    }
    case PopupType.TRANSACTION: {
      const { hash, type = NotificationType.ERROR } = content as PopupContentTxn
      notiType = type
      popupContent = <TransactionPopup hash={hash} notiType={notiType} />
      break
    }
    case PopupType.TOP_RIGHT: {
      const { title, summary, type, link } = getPopupTopRightDescriptionByType(popup)
      notiType = type
      popupContent = <SimplePopup title={title} type={notiType} summary={summary} link={link} />
      break
    }
  }
  return isRestartAnimation ? (
    <div />
  ) : (
    <PopupWrapper removeAfterMs={removeAfterMs}>
      <SolidBackgroundLayer />
      <Popup type={notiType}>
        <Flex justifyContent={'space-between'}>
          {popupContent}
          <StyledClose color={theme.text2} onClick={removeThisPopup} />
        </Flex>
        {removeAfterMs && <WrappedAnimatedFader removeAfterMs={removeAfterMs} />}
      </Popup>
      {hasOverlay && <Overlay />}
    </PopupWrapper>
  )
}
