import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import NumericalInputPanel from 'components/NumericalInputPanel'
import Row, { RowBetween } from 'components/Row'
import TextInputPanel from 'components/TextInputPanel'
import { Trans } from 'i18n'
import { useState } from 'react'
import styled from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'

const ModalWrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
`
const HeaderRow = styled(RowBetween)`
  display: flex;
  margin-bottom: 20px;
`

interface TokenomicsTableValues {
  index: number
  name: string
  amount: number
  unlockedAmount: number
  cliff: number
  vesting: number
}

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

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [unlockedAmount, setUnlockedAmount] = useState('')
  const [cliff, setCliff] = useState('')
  const [vesting, setVesting] = useState('')
  const onClick = () => {
    onSubmit({
      index: 0,
      name,
      amount: parseFloat(amount),
      unlockedAmount: parseFloat(unlockedAmount),
      cliff: parseFloat(cliff),
      vesting: parseFloat(vesting),
    })
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
          <TextInputPanel label="Tokenomics Type" placeholder="e.g. Treasury" value={name} onChange={setName} />
        </Row>
        <Row marginBottom="12px">
          <NumericalInputPanel label="Amount" placeholder="Token amount" value={amount} onChange={setAmount} />
        </Row>
        <Row marginBottom="12px">
          <NumericalInputPanel
            label="Unlocked at TGE"
            placeholder="Token amount that is unlocked at TGE"
            value={unlockedAmount}
            onChange={setUnlockedAmount}
          />
        </Row>
        <Row marginBottom="12px">
          <NumericalInputPanel label="Cliff" placeholder="Cliff in months" value={cliff} onChange={setCliff} />
        </Row>
        <Row marginBottom="12px">
          <NumericalInputPanel label="Vesting" placeholder="Vesting in months" value={vesting} onChange={setVesting} />
        </Row>
        <ButtonPrimary onClick={onClick}>Add</ButtonPrimary>
      </ModalWrapper>
    </Modal>
  )
}
