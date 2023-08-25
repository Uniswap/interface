import Modal from 'components/Modal'
import QRCodeHandler from 'components/QRCodeHandler'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

import PolygonIDGuideLabel from './PolygonIDGuideLabel'

const Container = styled.div`
  width: 100%;
  padding: 32px 40px;
  display: flex;
  flex-flow: column;
  align-items: center;
`

interface AuthenticationModalProps {
  onCancel: () => void
  onSuccess: () => void
}

export default function AuthenticationModal({ onSuccess, onCancel }: AuthenticationModalProps) {
  const [proofRequest, setProofRequest] = useState<string>('')
  const [showQr, setShowQr] = useState<boolean>(false)
  const kycEndpoint = 'https://verifier-v2.polygonid.me/api/sign-in?type=kycSig'
  useEffect(() => {
    const getProofRequest = async () => {
      const response = await fetch(kycEndpoint)
      const data = await response.json()
      setProofRequest(JSON.stringify(data))
      setShowQr(true)
    }
    getProofRequest()
  }, [])

  return (
    <Modal isOpen onDismiss={onCancel}>
      <Container>
        {showQr && <QRCodeHandler data={proofRequest} onSuccess={onSuccess} />}
        <PolygonIDGuideLabel>
          Please scan this QR code using <a href="https://beta.masca.io">masca.io</a> QR Scanner and carry out the
          Authorization Flow (Required credential: KYCAgeCredential).
        </PolygonIDGuideLabel>
      </Container>
    </Modal>
  )
}
