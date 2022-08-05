import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { CheckCircle } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { CloseIcon } from 'theme'

const ContentWrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 422px;
`
const InputWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 999px;
  padding: 4px;
  display: flex;
  width: 100%;
  margin-bottom: 24px;
  input {
    border: none;
    outline: none;
    color: ${({ theme }) => theme.text};
    font-size: 14px;
    background: transparent;
    flex: 1;
    padding-left: 10px;
  }
`
const AlertMessage = styled.span`
  position: absolute;
  top: -25px;
  background: #ddd;
  color: #222;
  border-radius: 5px;
  font-size: 12px;
  padding: 3px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  &.show {
    visibility: visible;
    opacity: 0.9;
  }
`
export default function ShareLinkModal({
  isOpen,
  onDismiss,
  shareUrl,
}: {
  isOpen: boolean
  onDismiss: () => void
  shareUrl: string
}) {
  const theme = useTheme()

  const [showAlert, setShowAlert] = useState(false)
  const handleCopyClick = () => {
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 2000)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <ContentWrapper>
        <Flex justifyContent="flex-end" alignSelf="stretch" marginBottom="32px">
          <CloseIcon onClick={onDismiss} size={24} />
        </Flex>
        <CheckCircle strokeWidth={1} size={80} color={theme.primary} style={{ marginBottom: '16px' }} />
        <Text fontSize={16} color={theme.primary} marginBottom="24px">
          <Trans>Successfully Created</Trans>
        </Text>
        <InputWrapper>
          <input type="text" value={shareUrl} readOnly />
          <CopyToClipboard text={shareUrl || ''} onCopy={handleCopyClick}>
            <ButtonPrimary fontSize={14} padding="8px 12px" width="auto">
              Copy Link
              <AlertMessage className={showAlert ? 'show' : ''}>Copied!</AlertMessage>
            </ButtonPrimary>
          </CopyToClipboard>
        </InputWrapper>
        <Text fontSize={16} color={theme.text} lineHeight="20px" textAlign="center">
          <Trans>Share your referral link and start earning commission instantly!</Trans>
        </Text>
      </ContentWrapper>
    </Modal>
  )
}
