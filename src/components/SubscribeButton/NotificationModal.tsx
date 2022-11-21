import { Trans, t } from '@lingui/macro'
import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Tooltip from 'components/Tooltip'
import useNotification from 'hooks/useNotification'
import usePrevious from 'hooks/usePrevious'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNotificationModalToggle } from 'state/application/hooks'

const Wrapper = styled.div`
  margin: 0;
  padding: 30px 24px;
  width: 100%;
`

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`

const ContentWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: column;
`

const ActionWrapper = styled.div`
  display: flex;
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 14px;
  `}
`

const CloseIcon = styled(X)`
  cursor: pointer;
`
const StyledText = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: ${({ theme }) => theme.subText};
`

const Input = styled.input`
  position: relative;
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  border-radius: 12px;
  width: 100%;
  padding: 14px 14px;
  color: ${({ theme }) => theme.text};
  font-size: 12px;
  background-color: ${({ theme }) => theme.buttonBlack};
  transition: border 0.5s;
  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 12px;
  }
`

const ButtonTextt = styled.div`
  font-size: 16px;
  font-weight: 500;
`

enum VIEW {
  SUBSCRIBE = 'Subscribe',
  SUBSCRIBE_SUCCESS = 'Verify Your Email',
  UNSUBSCRIBE = 'Unsubscribe',
}

export default function NotificationModal({
  subscribeContent,
  unsubscribeContent,
  notificationState,
}: {
  subscribeContent: ReactNode
  unsubscribeContent: ReactNode
  notificationState: ReturnType<typeof useNotification>
}) {
  const toggleModal = useNotificationModalToggle()
  const isOpen = useModalOpen(ApplicationModal.NOTIFICATION_SUBSCRIPTION)
  const theme = useTheme()
  const { isLoading, isSubscribed, isVerified, verifiedEmail, handleSubscribe, handleUnsubscribe } = notificationState
  const [email, setEmail] = useState(verifiedEmail ?? '')
  const [error, setError] = useState('')
  const [view, setView] = useState(isSubscribed && isVerified ? VIEW.UNSUBSCRIBE : VIEW.SUBSCRIBE)

  const setViewByStatus = useCallback(
    (isSubscribed: boolean, isVerified: boolean) =>
      setView(isSubscribed && isVerified ? VIEW.UNSUBSCRIBE : VIEW.SUBSCRIBE),
    [],
  )

  const prevOpen = usePrevious(isOpen)
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setError('')
    }
    if (prevOpen !== isOpen) {
      // make sure call when isOpen change
      setTimeout(() => setViewByStatus(isSubscribed, isVerified), isOpen ? 0 : 200)
    }
  }, [isOpen, prevOpen, isSubscribed, isVerified, setViewByStatus])

  useEffect(() => {
    if (isVerified && isSubscribed) setViewByStatus(isSubscribed, isVerified)
  }, [isVerified, isSubscribed, setViewByStatus])

  const onSubscribe = async () => {
    try {
      if (isLoading || error || !email) return
      await handleSubscribe(email)
      setTimeout(() => setView(prev => VIEW.SUBSCRIBE_SUCCESS))
    } catch (error) {
      console.log(error)
    }
  }
  const onUnsubscribe = async () => {
    try {
      if (isLoading) return
      await handleUnsubscribe()
      toggleModal()
    } catch (error) {
      console.log(error)
    }
  }

  const onChangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setEmail(value)
    setError(value.length && !value.match(/\S+@\S+\.\S+/) ? t`Email is invalid format` : '')
  }

  const content = (() => {
    switch (view) {
      case VIEW.SUBSCRIBE:
        return (
          <>
            <Flex flexDirection={'column'}>
              <StyledText>{subscribeContent}</StyledText>
              <Text color={theme.subText} marginBottom="10px" fontWeight={500}>
                <Trans>Your Email Address</Trans>
              </Text>
              <Tooltip text={error} show={!!error}>
                <Input
                  style={{ border: `1px solid ${error ? theme.red : 'transparent'}` }}
                  value={email}
                  placeholder="example@gmail.com"
                  onChange={onChangeInput}
                />
              </Tooltip>
            </Flex>
            <ActionWrapper>
              <ButtonPrimary disabled={isLoading} borderRadius="46px" height="44px" onClick={onSubscribe}>
                {isLoading ? (
                  <Flex alignItems={'center'}>
                    <Loader />
                    <ButtonTextt style={{ marginLeft: '5px' }}>
                      <Trans>Subscribing ...</Trans>
                    </ButtonTextt>
                  </Flex>
                ) : (
                  <ButtonTextt>
                    <Trans>Subscribe</Trans>
                  </ButtonTextt>
                )}
              </ButtonPrimary>
            </ActionWrapper>
          </>
        )
      case VIEW.UNSUBSCRIBE:
        return (
          <div>
            <StyledText>{unsubscribeContent}</StyledText>
            <ActionWrapper>
              <ButtonPrimary borderRadius="46px" height="44px" onClick={toggleModal}>
                <ButtonTextt>
                  <Trans>No, go back</Trans>
                </ButtonTextt>
              </ButtonPrimary>
              <ButtonOutlined onClick={onUnsubscribe} borderRadius="46px" height="44px">
                <ButtonTextt>
                  <Trans>Yes</Trans>
                </ButtonTextt>
              </ButtonOutlined>
            </ActionWrapper>
          </div>
        )
      case VIEW.SUBSCRIBE_SUCCESS:
        return (
          <div>
            <StyledText>
              <Trans>Please check your inbox to verify your email account</Trans>
            </StyledText>
            <ActionWrapper>
              <ButtonPrimary borderRadius="46px" height="44px" onClick={toggleModal}>
                <ButtonTextt>
                  <Trans>Okay</Trans>
                </ButtonTextt>
              </ButtonPrimary>
            </ActionWrapper>
          </div>
        )
    }
  })()

  return (
    <Modal isOpen={isOpen} onDismiss={toggleModal} minHeight={false} maxWidth={450}>
      <Wrapper>
        <HeaderWrapper>
          <Text fontSize={20} fontWeight={500}>
            {view}
          </Text>
          <CloseIcon onClick={toggleModal} />
        </HeaderWrapper>
        <ContentWrapper>{content}</ContentWrapper>
      </Wrapper>
    </Modal>
  )
}
