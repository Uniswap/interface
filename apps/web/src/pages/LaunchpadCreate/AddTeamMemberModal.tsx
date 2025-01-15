import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import TextInputPanel from 'components/TextInputPanel'
import { Trans } from 'i18n'
import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import { TeamTableValues } from './launchpad-state'

const ModalWrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
`

const HeaderRow = styled(RowBetween)`
  display: flex;
  margin-bottom: 20px;
`

export default function AddTeamMemberModal({
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

  // Form state
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [twitter, setTwitter] = useState('')

  // Validation states - Required fields
  const nameError = useMemo(() => name.trim().length === 0, [name])
  const positionError = useMemo(() => position.trim().length === 0, [position])
  const imgUrlError = useMemo(() => {
    if (imgUrl.trim().length === 0) return true
    try {
      new URL(imgUrl)
      return false
    } catch {
      return true
    }
  }, [imgUrl])

  // Optional fields validation (only if filled)
  const linkedinError = useMemo(() => {
    if (linkedin.trim().length === 0) return false // Optional field
    return !linkedin.includes('linkedin.com')
  }, [linkedin])

  const twitterError = useMemo(() => {
    if (twitter.trim().length === 0) return false // Optional field
    return !twitter.includes('twitter.com') && !twitter.includes('x.com')
  }, [twitter])

  // Check if form is valid
  const isFormValid = useMemo(() => {
    // Required fields must be filled and valid
    const requiredFieldsValid = !nameError && !positionError && !imgUrlError

    // Optional fields must be valid if filled
    const optionalFieldsValid = !linkedinError && !twitterError

    return requiredFieldsValid && optionalFieldsValid
  }, [nameError, positionError, imgUrlError, linkedinError, twitterError])

  const onClick = () => {
    if (isFormValid) {
      onSubmit({
        index: 0,
        name,
        position,
        imgUrl,
        linkedin,
        twitter,
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onClose}>
      <ModalWrapper>
        <HeaderRow>
          <ThemedText.SubHeader>
            <Trans>Add Team Member</Trans>
          </ThemedText.SubHeader>
          <CloseIcon onClick={onClose} />
        </HeaderRow>
        <Row marginBottom="12px">
          <TextInputPanel
            label="Name"
            placeholder="Name of the team member"
            value={name}
            onChange={setName}
            isError={nameError}
            errorMessage="Name is required"
          />
        </Row>
        <Row marginBottom="12px">
          <TextInputPanel
            label="Position"
            placeholder="e.g. CEO"
            value={position}
            onChange={setPosition}
            isError={positionError}
            errorMessage="Position is required"
          />
        </Row>
        <Row marginBottom="12px">
          <TextInputPanel
            label="Image"
            placeholder="Image URL"
            value={imgUrl}
            onChange={setImgUrl}
            isError={imgUrlError}
            errorMessage="Please enter a valid image URL"
          />
        </Row>
        <Row marginBottom="12px">
          <TextInputPanel
            label="Linkedin"
            placeholder="Linkedin link (optional)"
            value={linkedin}
            onChange={setLinkedin}
            isError={linkedinError}
            errorMessage="Please enter a valid LinkedIn URL"
          />
        </Row>
        <Row marginBottom="12px">
          <TextInputPanel
            label="Twitter"
            placeholder="Twitter/X link (optional)"
            value={twitter}
            onChange={setTwitter}
            isError={twitterError}
            errorMessage="Please enter a valid Twitter/X URL"
          />
        </Row>
        <ButtonPrimary onClick={onClick} disabled={!isFormValid}>
          Add
        </ButtonPrimary>
      </ModalWrapper>
    </Modal>
  )
}
