import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
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

interface TeamTableValues {
  index: number
  name: string
  position: string
  imgUrl: string
  linkedin: string
  twitter: string
}

export default function AddTokenomicsModal({
  isOpen,
  onDismiss,
  onSubmit,
}: {
  isOpen: boolean
  onDismiss: () => void
  onSubmit: (info: TeamTableValues) => void
}) {
  const onClose = () => {
    if (onDismiss) {
      onDismiss()
    }
  }

  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [twitter, setTwitter] = useState('')
  const onClick = () => {
    onSubmit({
      index: 0,
      name,
      position,
      imgUrl,
      linkedin,
      twitter,
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
          <TextInputPanel label="Name" placeholder="Name of the team member" value={name} onChange={setName} />
        </Row>
        <Row marginBottom="12px">
          <TextInputPanel label="Position" placeholder="e.g. CEO" value={position} onChange={setPosition} />
        </Row>
        <Row marginBottom="12px">
          <TextInputPanel label="Image" placeholder="Image URL" value={imgUrl} onChange={setImgUrl} />
        </Row>
        <Row marginBottom="12px">
          <TextInputPanel label="Linkedin" placeholder="Linkedin link" value={linkedin} onChange={setLinkedin} />
        </Row>
        <Row marginBottom="12px">
          <TextInputPanel label="Twitter" placeholder="Twitter link" value={twitter} onChange={setTwitter} />
        </Row>
        <ButtonPrimary onClick={onClick}>Add</ButtonPrimary>
      </ModalWrapper>
    </Modal>
  )
}
