import React from 'react'
import { Text } from 'rebass'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import { ModalSection, Wrapper } from '../bridge/styleds'
import { RowBetween } from '../Row'
import { CloseIcon } from '../../theme/components'

export default function UnsupportedBridgeTokenModal({
  isOpen,
  setIsOpen
}: {
  isOpen: boolean
  setIsOpen: (val: boolean) => void
}) {
  const handleDismiss = () => setIsOpen(false)

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss}>
      <Wrapper>
        <ModalSection>
          <RowBetween>
            <Text fontWeight={500} fontSize={20}>
              Unsupported Token
            </Text>
            <CloseIcon onClick={handleDismiss} />
          </RowBetween>
        </ModalSection>
        <ModalSection light>
          <AutoColumn gap="lg">
            The bridge supports only ERC20 and as Fuse is a native currency moving it to mainnet through this interface
            coming soon. In the meanwhile you can contact support hello@fuse.io
          </AutoColumn>
        </ModalSection>
      </Wrapper>
    </Modal>
  )
}
