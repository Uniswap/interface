import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { useExpertModeManager } from 'state/user/hooks'

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 24px 28px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const StyledInput = styled.input`
  margin-top: 24px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 16px;
  outline: none;
  color: ${({ theme }) => theme.text};
  border: none;
  &::placeholder {
    color: ${({ theme }) => theme.disableText};
  }
`

const StyledCloseIcon = styled(X)`
  height: 28px;
  width: 28px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text};
  }
`

function AdvanceModeModal({ show, setShow }: { show: boolean; setShow: (v: boolean) => void }) {
  const [, toggleExpertMode] = useExpertModeManager()
  const [confirmText, setConfirmText] = useState('')
  const theme = useTheme()

  const handleConfirm = () => {
    if (confirmText.trim().toLowerCase() === 'confirm') {
      toggleExpertMode()
      setConfirmText('')
      setShow(false)
    }
  }

  return (
    <Modal
      isOpen={show}
      onDismiss={() => {
        setConfirmText('')
        setShow(false)
      }}
      maxHeight={100}
    >
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontSize="20px" fontWeight={500}>
            <Trans>Are you sure?</Trans>
          </Text>

          <StyledCloseIcon onClick={() => setShow(false)} />
        </Flex>

        <Text marginTop="28px">
          <Trans>
            <Text color={theme.warning} as="span" fontWeight="500">
              Advanced Mode
            </Text>{' '}
            turns off the &apos;Confirm&apos; transaction prompt and allows high slippage trades that can result in bad
            rates and lost funds.
          </Trans>
        </Text>

        <Text marginTop="20px">
          <Trans>Please type the word &apos;confirm&apos; below to enable Advanced Mode.</Trans>
        </Text>

        <StyledInput
          placeholder="confirm"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          onKeyUp={e => {
            if (e.key === 'Enter') {
              handleConfirm()
            }
          }}
        />
        <Text marginTop="8px" fontSize="12px" color={theme.subText}>
          <Trans>Use this mode if you are aware of the risks.</Trans>
        </Text>

        <Flex sx={{ gap: '16px' }} marginTop="28px" justifyContent={'center'}>
          <ButtonOutlined onClick={handleConfirm} style={{ fontSize: '16px', flex: 1, padding: '10px' }}>
            <Trans>Confirm</Trans>
          </ButtonOutlined>

          <ButtonPrimary
            style={{
              border: 'none',
              background: theme.warning,
              flex: 1,
              fontSize: '16px',
              padding: '10px',
            }}
            onClick={() => {
              setConfirmText('')
              setShow(false)
            }}
          >
            <Trans>Cancel</Trans>
          </ButtonPrimary>
        </Flex>
      </ModalContentWrapper>
    </Modal>
  )
}

export default AdvanceModeModal
