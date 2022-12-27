import { Trans } from '@lingui/macro'
import { ReactNode, useEffect, useRef } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import NotificationIcon from 'components/Icons/NotificationIcon'
import { useWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { useNotificationModalToggle } from 'state/application/hooks'

import { ButtonPrimary } from '../Button'
import { MouseoverTooltipDesktopOnly } from '../Tooltip'

const cssSubscribeBtnSmall = (bgColor: string) => css`
  width: 36px;
  min-width: 36px;
  padding: 6px;
  background: ${bgColor};
  &:hover {
    background: ${bgColor};
  }
`
const SubscribeBtn = styled(ButtonPrimary)<{
  isDisabled?: boolean
  iconOnly?: boolean
  bgColor: string
}>`
  overflow: hidden;
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  background: ${({ bgColor }) => bgColor};
  color: ${({ theme, isDisabled }) => (isDisabled ? theme.border : theme.textReverse)};
  &:hover {
    background: ${({ bgColor }) => bgColor};
  }
  ${({ iconOnly, bgColor }) => iconOnly && cssSubscribeBtnSmall(bgColor)};
  ${({ theme, bgColor }) => theme.mediaWidth.upToExtraSmall`
   ${cssSubscribeBtnSmall(bgColor)}
  `}
`

const ButtonText = styled(Text)<{ iconOnly?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  margin-left: 6px !important;
  ${({ iconOnly }) => iconOnly && `display: none`};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`
export default function SubscribeNotificationButton({
  subscribeTooltip,
  iconOnly = false,
  trackingEvent,
}: {
  subscribeTooltip?: ReactNode
  iconOnly?: boolean
  trackingEvent?: MIXPANEL_TYPE
}) {
  const theme = useTheme()
  const toggleSubscribeModal = useNotificationModalToggle()
  const { account } = useWeb3React()

  const { mixpanelHandler } = useMixpanel()
  const { refreshTopics } = useNotification()

  const showModalWhenConnected = useRef(false)

  useEffect(() => {
    if (account && showModalWhenConnected.current) {
      toggleSubscribeModal()
      showModalWhenConnected.current = false
    }
  }, [account, toggleSubscribeModal])

  const onClickBtn = () => {
    refreshTopics()
    toggleSubscribeModal()
    if (trackingEvent)
      setTimeout(() => {
        mixpanelHandler(trackingEvent)
      }, 100)
    if (!account) showModalWhenConnected.current = true
  }

  return (
    <MouseoverTooltipDesktopOnly text={subscribeTooltip} width="400px">
      <SubscribeBtn bgColor={theme.primary} onClick={onClickBtn} iconOnly={iconOnly}>
        <NotificationIcon />
        <ButtonText iconOnly={iconOnly}>
          <Trans>Subscribe</Trans>
        </ButtonText>
      </SubscribeBtn>
    </MouseoverTooltipDesktopOnly>
  )
}
