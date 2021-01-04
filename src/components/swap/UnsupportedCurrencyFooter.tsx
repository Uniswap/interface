import React, { useState } from 'react'
import styled from 'styled-components'
import { TYPE, CloseIcon } from 'theme'
import { ButtonEmpty } from 'components/Button'
import Modal from 'components/Modal'
import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'

const DetailsFooter = styled.div<{ show: boolean }>`
  padding-top: calc(16px + 2rem);
  padding-bottom: 20px;
  margin-top: -2rem;
  width: 100%;
  max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  z-index: -1;

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
  text-align: center;
`

export default function UnsupportedCurrencyFooter({ show }: { show: boolean }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <DetailsFooter show={show}>
      <Modal isOpen={showDetails} onDismiss={() => setShowDetails(false)}>
        <Card padding="2rem">
          <AutoColumn gap="lg">
            <RowBetween>
              <TYPE.largeHeader>Unsupported Assets</TYPE.largeHeader>
              <CloseIcon onClick={() => setShowDetails(false)} />
            </RowBetween>
            <AutoColumn gap="lg">
              <TYPE.body fontWeight={500}>
                Some assets are not available through this interface because they either don’t work well with our smart
                contract or are considered securities in certain jurisdictions.
              </TYPE.body>
              <TYPE.body fontWeight={500}>
                This app uses a list prepared by the [Blockchain Association](link). You can read more about it and the
                reasons it exists [here](link).
              </TYPE.body>
            </AutoColumn>
          </AutoColumn>
        </Card>
      </Modal>
      <ButtonEmpty padding={'0'} onClick={() => setShowDetails(true)}>
        <TYPE.blue>Read more about unsupported assets</TYPE.blue>
      </ButtonEmpty>
    </DetailsFooter>
  )
}
