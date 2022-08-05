import { Trans } from '@lingui/macro'
import React from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useTrueSightUnsubscribeModalToggle } from 'state/application/hooks'

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
  margin-top: 26px;
`

const ActionWrapper = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 24px;
`

const CloseIcon = styled(X)`
  cursor: pointer;
`

export default function UnsubscribeModal({ handleUnsubscribe }: { handleUnsubscribe: () => void }) {
  const toggleUnsubscribeModal = useTrueSightUnsubscribeModalToggle()
  const unSubscribeModalOpen = useModalOpen(ApplicationModal.UNSUBSCRIBE_TRUESIGHT)
  const theme = useTheme()

  return (
    <Modal isOpen={unSubscribeModalOpen} onDismiss={toggleUnsubscribeModal} minHeight={false} maxWidth={512}>
      <Wrapper>
        <HeaderWrapper>
          <Text fontSize={20} fontWeight={500}>
            <Trans>Unsubscribe</Trans>
          </Text>
          <CloseIcon onClick={toggleUnsubscribeModal} />
        </HeaderWrapper>
        <ContentWrapper>
          <Text fontSize={16} fontWeight={500} color={theme.subText}>
            <Trans>
              Are you sure you want to unsubscribe? You will stop receiving notifications on latest tokens that could be
              trending soon!
            </Trans>
          </Text>
        </ContentWrapper>
        <ActionWrapper>
          <ButtonPrimary borderRadius="46px" height="44px" onClick={toggleUnsubscribeModal}>
            <Text fontSize={16} fontWeight={500}>
              <Trans>No, go back</Trans>
            </Text>
          </ButtonPrimary>
          <ButtonOutlined onClick={handleUnsubscribe} borderRadius="46px" height="44px">
            <Text fontSize={16} fontWeight={500}>
              <Trans>Yes</Trans>
            </Text>
          </ButtonOutlined>
        </ActionWrapper>
      </Wrapper>
    </Modal>
  )
}
