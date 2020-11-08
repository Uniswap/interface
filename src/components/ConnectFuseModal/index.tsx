import React, { useState, Dispatch, SetStateAction } from 'react'
import Modal from '../Modal'
import { Wrapper } from '../swap/styleds'
import { ModalSection } from '../bridge/styleds'
import { Text, Link as RebassLink } from 'rebass'
import step1Img from '../../assets/images/connect-step-1.png'
import styled from 'styled-components'
import step2Img from '../../assets/images/connect-step-2.png'

const Link = styled(RebassLink)`
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const Img = styled.img`
  width: 100%;
  margin-bottom: 1rem;
`

function StepOne({ showStepTwo }: { showStepTwo: Dispatch<SetStateAction<boolean>> }) {
  const handleClick = () => showStepTwo(true)
  return (
    <>
      <Text fontSize={20} fontWeight={500} textAlign="center" paddingBottom="1rem">
        CONNECT TO FUSE NETWORK
      </Text>
      <Img src={step1Img} />
      <Text>
        <Link id="fuse-connect-open-step2" onClick={handleClick} style={{ fontWeight: 500, cursor: 'pointer' }}>
          Click here
        </Link>{' '}
        to learn how to add Fuse network to Metamask
      </Text>
    </>
  )
}

function StepTwo() {
  return (
    <>
      <Text fontSize={20} fontWeight={500} textAlign="center" paddingBottom="1rem">
        ADD FUSE NETWORK TO METAMASK
      </Text>
      <Img src={step2Img} />
      <Wrapper>
        <Text display="inline" fontWeight={500}>
          Network Name:
        </Text>{' '}
        <Text display="inline">Fuse network</Text>
      </Wrapper>
      <Wrapper>
        <Text display="inline" fontWeight={500}>
          New RPC URL:
        </Text>{' '}
        <Text display="inline">https://rpc.fuse.io</Text>
      </Wrapper>
      <Wrapper>
        <Text display="inline" fontWeight={500}>
          ChainId:
        </Text>{' '}
        <Text display="inline">0x7a</Text>
      </Wrapper>
      <Wrapper>
        <Text display="inline" fontWeight={500}>
          Symbol:
        </Text>{' '}
        <Text display="inline">FUSE</Text>
      </Wrapper>
      <Wrapper>
        <Text display="inline" fontWeight={500}>
          Explorer:
        </Text>{' '}
        <Text display="inline">https://explorer.fuse.io</Text>
      </Wrapper>
    </>
  )
}

export default function ConnectFuseModal({
  isOpen,
  setIsOpen
}: {
  isOpen: boolean
  setIsOpen: (val: boolean) => void
}) {
  const [showStepTwo, setShowStepTwo] = useState<boolean>(false)

  const handleDismiss = () => {
    setIsOpen(false)
    setShowStepTwo(false)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={100}>
      <Wrapper id="fuse-connect-modal">
        <ModalSection light>{showStepTwo ? <StepTwo /> : <StepOne showStepTwo={setShowStepTwo} />}</ModalSection>
      </Wrapper>
    </Modal>
  )
}
