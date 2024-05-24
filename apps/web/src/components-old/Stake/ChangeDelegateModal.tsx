import { useUbeTokenContract } from 'hooks/useContract'
import { useDoTransaction } from 'pages/Stake/hooks/useDoTransaction'
import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import styled from 'styled-components'
import { isAddress } from 'utilities/src/addresses'
import { ButtonError } from '../Button'
import { SearchInput } from '../SearchModal/styleds'

import { CloseIcon } from 'theme/components'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import Row, { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  flex: 1 1;
  position: relative;
  padding: 1rem;
`

interface ChangeDelegateModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function ChangeDelegateModal({ isOpen, onDismiss }: ChangeDelegateModalProps) {
  const { t } = useTranslation()

  const inputRef = useRef<HTMLInputElement>()
  const [delegateAddress, setDelegateAddress] = useState<string>('')
  const [error, setError] = useState<string | undefined>('ChangeDelegate')

  const c = useUbeTokenContract()
  const doTransaction = useDoTransaction()

  const handleInput = (event: any) => {
    const input = event.target.value
    setDelegateAddress(input)
  }

  useEffect(() => {
    if (delegateAddress.length === 0) {
      setError(t('ChangeDelegate'))
    } else if (isAddress(delegateAddress)) {
      setError(undefined)
    } else {
      if (delegateAddress.length > 0) {
        setError(t('EnterValidDelegateAddress'))
      } else {
        setError(undefined)
      }
    }
  }, [delegateAddress, t])

  const onConfirm = useCallback(async () => {
    if (c) {
      await doTransaction(c, 'delegate', {
        args: [delegateAddress],
        summary: `Change Delegate Address`,
      })
      setDelegateAddress('')
    }
    onDismiss()
  }, [c, onDismiss, doTransaction, delegateAddress])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <ContentWrapper gap="12px">
        <AutoColumn gap="12px">
          <RowBetween>
            <Text fontWeight={500} fontSize={16}>
              {t('ChangeDelegate')}
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <Row>
            <SearchInput
              type="text"
              id="delegate-input"
              placeholder={t('EnterDelegateAddress')}
              autoComplete="off"
              value={delegateAddress}
              ref={inputRef as RefObject<HTMLInputElement>}
              onChange={handleInput}
            />
          </Row>
        </AutoColumn>
        <ButtonError disabled={!!error} onClick={onConfirm}>
          {error ? error : t('ChangeDelegate')}
        </ButtonError>
      </ContentWrapper>
    </Modal>
  )
}
