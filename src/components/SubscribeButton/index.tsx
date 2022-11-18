import { Trans, t } from '@lingui/macro'
import { ReactNode, useCallback } from 'react'
import { BellOff } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { Spinner } from 'components/Header/Polling'
import NotificationIcon from 'components/Icons/NotificationIcon'
import NotificationModal from 'components/SubscribeButton/NotificationModal'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification, { NOTIFICATION_TOPICS } from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNotificationModalToggle, useWalletModalToggle } from 'state/application/hooks'

import { ButtonOutlined, ButtonPrimary } from '../Button'
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
  isDisabled: boolean
  iconOnly?: boolean
  bgColor: string
  needVerify: boolean
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

const cssUnsubscribeBtnSmall = css`
  width: 36px;
  min-width: 36px;
  padding: 6px;
`
const UnSubscribeButton = styled(ButtonOutlined)<{ iconOnly?: boolean }>`
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  ${({ iconOnly }) => iconOnly && cssUnsubscribeBtnSmall};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
   ${cssUnsubscribeBtnSmall}
  `}
`

const StyledSpinner = styled(Spinner)<{ color: string }>`
  border-left: ${({ color }) => `1px solid  ${color}`};
  width: 16px;
  height: 16px;
  top: 0px;
  left: 0px;
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
  unsubscribeTooltip,
  subscribeModalContent,
  unsubscribeModalContent,
  topicId,
  iconOnly = false,
}: {
  subscribeTooltip?: ReactNode
  unsubscribeTooltip?: ReactNode
  subscribeModalContent?: ReactNode
  unsubscribeModalContent?: ReactNode
  topicId: number
  iconOnly?: boolean
}) {
  const theme = useTheme()
  const toggleSubscribeModal = useNotificationModalToggle()
  const notificationState = useNotification(topicId)
  const { isLoading, isSubscribed, isVerified, setNeedShowModalSubscribeState, checkVerifyStatus } = notificationState

  const { mixpanelHandler } = useMixpanel()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const trackingSubScribe = useCallback(() => {
    switch (topicId) {
      case NOTIFICATION_TOPICS.TRENDING_SOON:
        mixpanelHandler(MIXPANEL_TYPE.DISCOVER_CLICK_SUBSCRIBE_TRENDING_SOON)
        break
    }
  }, [mixpanelHandler, topicId])

  const trackingUnSubScribe = useCallback(() => {
    switch (topicId) {
      case NOTIFICATION_TOPICS.TRENDING_SOON:
        mixpanelHandler(MIXPANEL_TYPE.DISCOVER_CLICK_UNSUBSCRIBE_TRENDING_SOON)
        break
    }
  }, [mixpanelHandler, topicId])
  const needVerify = isSubscribed && !isVerified
  const onClickBtn = useCallback(() => {
    if (!account) {
      toggleWalletModal()
      setNeedShowModalSubscribeState(true)
      return
    }
    if (needVerify) {
      checkVerifyStatus()
    }
    setTimeout(() => {
      isSubscribed ? trackingUnSubScribe() : trackingSubScribe()
      toggleSubscribeModal()
    }, 100)
  }, [
    trackingUnSubScribe,
    trackingSubScribe,
    account,
    isSubscribed,
    toggleSubscribeModal,
    toggleWalletModal,
    setNeedShowModalSubscribeState,
    needVerify,
    checkVerifyStatus,
  ])

  const isOpen = useModalOpen(ApplicationModal.NOTIFICATION_SUBSCRIPTION)
  const isDisabled = isLoading
  return (
    <>
      {isSubscribed && isVerified ? (
        <MouseoverTooltipDesktopOnly text={unsubscribeTooltip} width="400px">
          <UnSubscribeButton disabled={isDisabled} onClick={onClickBtn} iconOnly={iconOnly}>
            {isLoading ? <StyledSpinner color={theme.primary} /> : <BellOff color={theme.subText} size={18} />}

            <ButtonText color={'primary'} iconOnly={iconOnly}>
              <Trans>Unsubscribe</Trans>
            </ButtonText>
          </UnSubscribeButton>
        </MouseoverTooltipDesktopOnly>
      ) : (
        <MouseoverTooltipDesktopOnly
          text={
            !needVerify
              ? subscribeTooltip
              : t`You will need to verify your email account first to start receiving notifications`
          }
          width="400px"
        >
          <SubscribeBtn
            needVerify={needVerify}
            bgColor={needVerify ? theme.warning : isDisabled ? theme.buttonGray : theme.primary}
            isDisabled={isDisabled}
            onClick={onClickBtn}
            iconOnly={iconOnly}
          >
            {isLoading ? <StyledSpinner color={theme.primary} /> : <NotificationIcon />}

            <ButtonText iconOnly={iconOnly}>
              <Trans>Subscribe</Trans>
            </ButtonText>
          </SubscribeBtn>
        </MouseoverTooltipDesktopOnly>
      )}
      {isOpen && (
        <NotificationModal
          notificationState={notificationState}
          subscribeContent={subscribeModalContent}
          unsubscribeContent={unsubscribeModalContent}
        />
      )}
    </>
  )
}
