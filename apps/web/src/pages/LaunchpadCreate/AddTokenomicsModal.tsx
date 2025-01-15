import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import NumericalInputPanel from 'components/NumericalInputPanel'
import Row, { RowBetween } from 'components/Row'
import TextInputPanel from 'components/TextInputPanel'
import { Trans } from 'i18n'
import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import { TokenomicsTableValues } from './launchpad-state'

const ModalWrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
`

const HeaderRow = styled(RowBetween)`
  display: flex;
  margin-bottom: 20px;
`

export default function AddTokenomicsModal({
  isOpen,
  onDismiss,
  onSubmit,
}: {
  isOpen: boolean
  onDismiss: () => void
  onSubmit: (info: TokenomicsTableValues) => void
}) {
  const onClose = () => {
    if (onDismiss) {
      onDismiss()
    }
  }

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [unlockedAmount, setUnlockedAmount] = useState('')
  const [cliff, setCliff] = useState('')
  const [vesting, setVesting] = useState('')

  // Validation states
  const nameError = useMemo(() => name.trim().length === 0, [name])
  const amountError = useMemo(() => {
    const value = parseFloat(amount)
    return isNaN(value) || value <= 0
  }, [amount])
  const unlockedError = useMemo(() => {
    const value = parseFloat(unlockedAmount)
    const totalAmount = parseFloat(amount)
    return isNaN(value) || value < 0 || (totalAmount > 0 && value > totalAmount)
  }, [unlockedAmount, amount])
  const cliffError = useMemo(() => {
    const value = parseFloat(cliff)
    return isNaN(value) || value < 0
  }, [cliff])
  const vestingError = useMemo(() => {
    const value = parseFloat(vesting)
    return isNaN(value) || value < 0
  }, [vesting])

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return !nameError && !amountError && !unlockedError && !cliffError && !vestingError
  }, [nameError, amountError, unlockedError, cliffError, vestingError])

  const onClick = () => {
    if (isFormValid) {
      onSubmit({
        index: 0,
        name,
        amount: parseFloat(amount),
        unlockedAmount: parseFloat(unlockedAmount),
        cliffInDays: parseFloat(cliff),
        vestingInDays: parseFloat(vesting),
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onClose}>
      <ModalWrapper>
        <HeaderRow>
          <ThemedText.SubHeader>
            <Trans>Add Tokenomics Info</Trans>
          </ThemedText.SubHeader>
          <CloseIcon onClick={onClose} />
        </HeaderRow>
        <Row marginBottom="12px">
          <TextInputPanel
            label="Tokenomics Type"
            placeholder="e.g. Treasury"
            value={name}
            onChange={setName}
            isError={nameError}
            errorMessage="Tokenomics type is required"
          />
        </Row>
        <Row marginBottom="12px">
          <NumericalInputPanel
            label="Amount"
            placeholder="Token amount"
            value={amount}
            onChange={setAmount}
            isError={amountError}
            errorMessage="Please enter a valid amount greater than 0"
          />
        </Row>
        <Row marginBottom="12px">
          <NumericalInputPanel
            label="Unlocked at TGE"
            placeholder="Token amount that is unlocked at TGE"
            value={unlockedAmount}
            onChange={setUnlockedAmount}
            isError={unlockedError}
            errorMessage="Unlocked amount must be between 0 and total amount"
          />
        </Row>
        <Row marginBottom="12px">
          <NumericalInputPanel
            label="Cliff"
            placeholder="Cliff in months"
            value={cliff}
            onChange={setCliff}
            isError={cliffError}
            errorMessage="Please enter a valid cliff period"
          />
        </Row>
        <Row marginBottom="12px">
          <NumericalInputPanel
            label="Vesting"
            placeholder="Vesting in months"
            value={vesting}
            onChange={setVesting}
            isError={vestingError}
            errorMessage="Please enter a valid vesting period"
          />
        </Row>
        <ButtonPrimary onClick={onClick} disabled={!isFormValid}>
          Add
        </ButtonPrimary>
      </ModalWrapper>
    </Modal>
  )
}
