import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { Dispatch, SetStateAction, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonErrorStyle, ButtonOutlined } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'

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
`

export default function SwapModalAreYouSure({
  show,
  setShow,
  setHasAcceptedNewAmount,
  parsedAmountOut,
  parsedAmountOutFromBuild,
  formattedOutputChangePercent,
}: {
  show: boolean
  setShow: Dispatch<SetStateAction<boolean>>
  setHasAcceptedNewAmount: Dispatch<SetStateAction<boolean>>
  parsedAmountOut: CurrencyAmount<Currency> | undefined
  parsedAmountOutFromBuild: CurrencyAmount<Currency> | undefined
  formattedOutputChangePercent: string
}) {
  const [confirmText, setConfirmText] = useState('')

  const handleConfirm = () => {
    if (confirmText.trim().toLowerCase() === 'confirm') {
      setHasAcceptedNewAmount(true)
      setConfirmText('')
      setShow(false)
    }
  }

  const theme = useTheme()

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

          <StyledCloseIcon color={theme.text} onClick={() => setShow(false)} />
        </Flex>

        <Text fontSize={14} marginTop="28px">
          <Trans>
            Due to market conditions, your output has been updated from {parsedAmountOut?.toSignificant(10)}{' '}
            {parsedAmountOut?.currency?.symbol} to {parsedAmountOutFromBuild?.toSignificant(10)}{' '}
            {parsedAmountOut?.currency?.symbol} ({formattedOutputChangePercent}%).
          </Trans>
        </Text>

        <Text fontSize={14} marginTop="28px">
          <Trans>
            If you&apos;re okay with this, please type the word &apos;confirm&apos; below to accept this new amount.
          </Trans>
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
        <Flex sx={{ gap: '16px' }} marginTop="28px" justifyContent={'center'}>
          <ButtonOutlined
            style={{
              flex: 1,
              fontSize: '14px',
              padding: '10px',
            }}
            onClick={() => {
              setConfirmText('')
              setShow(false)
            }}
          >
            <Trans>No, go back</Trans>
          </ButtonOutlined>
          <ButtonErrorStyle
            disabled={confirmText.trim().toLowerCase() !== 'confirm'}
            style={{ fontSize: '14px', flex: 1, padding: '10px' }}
            onClick={handleConfirm}
          >
            <Trans>Confirm</Trans>
          </ButtonErrorStyle>
        </Flex>
      </ModalContentWrapper>
    </Modal>
  )
}
