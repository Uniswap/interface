import React from 'react'
import styled from 'styled-components'
import Modal from '../Modal'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #2c2f36;
  text-align: center;
`

const Body = styled.div`
  padding: 0.5rem 1.5rem 1rem;
`

interface FeeModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function FeeModal({ isOpen, onDismiss }: FeeModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <AutoColumn gap="md">
        <Header>
          <TYPE.mediumHeader>About Fees</TYPE.mediumHeader>
        </Header>
        <Body>
          <TYPE.body>
            Depositing to the Fuse network is free and don&rsquo;t have additional charges On withdrawing from the Fuse
            network the fee of 0.5% is taken, while the minimum transaction is around 1000 USD The fee&rsquo;s are taken
            to repay the network fees on the Ethereum network
          </TYPE.body>
        </Body>
      </AutoColumn>
    </Modal>
  )
}
