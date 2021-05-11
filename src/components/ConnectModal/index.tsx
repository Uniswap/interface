import React from 'react'
import { Text } from 'rebass'
import { ChainId } from '@fuseio/fuse-swap-sdk'
import styled from 'styled-components'
import Modal from '../Modal'
import { Wrapper } from '../swap/styleds'
import { ModalSection } from '../bridge/styleds'
import mainnetImg from '../../assets/images/switch-main.png'

const Title = styled(Text)`
  margin-bottom: 1rem;
`

const Img = styled.img`
  width: 100%;
`

export default function ConnectModal({
  isOpen,
  setIsOpen,
  chainId
}: {
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  chainId: number
}) {
  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} maxHeight={100}>
      <Wrapper id="connect-modal">
        <ModalSection light>
          {chainId === ChainId.MAINNET && (
            <>
              <Title fontSize={20} fontWeight={500} textAlign="center" paddingBottom="1rem">
                Connect to Mainnet
              </Title>
              <Img src={mainnetImg} />
            </>
          )}
        </ModalSection>
      </Wrapper>
    </Modal>
  )
}
