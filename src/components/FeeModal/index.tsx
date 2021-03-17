import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import Modal from '../Modal'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import FeeCard from './FeeCard'
import ethLogo from '../../assets/images/ethereum-logo.png'
import bnbLogo from '../../assets/svg/bnb.svg'
import infoIcon from '../../assets/svg/white-info.svg'

const Header = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid #2c2f36;
  text-align: center;
`

const Body = styled.div`
  padding: 0.5rem 1.5rem 0;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`

const NetworkFee = styled.div`
  margin-bottom: 2.5rem;
`

const Network = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`

const NetworkLogo = styled.img`
  width: 36px;
  margin-right: 0.5rem;
`

const InfoIcon = styled.img.attrs({
  src: infoIcon
})`
  width: 18px;
  margin-right: 8px;
`

const Footer = styled.div`
  display: flex;
  padding: 0 1.5rem 1.5rem;
`

interface FeeModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function FeeModal({ isOpen, onDismiss }: FeeModalProps) {
  const theme = useContext(ThemeContext)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} backgroundColor={theme.bg1}>
      <AutoColumn gap="md" style={{ width: '100%' }}>
        <Header>
          <TYPE.mediumHeader>Bridge Fees</TYPE.mediumHeader>
        </Header>
        <Body>
          <NetworkFee>
            <Network>
              <NetworkLogo src={ethLogo} />
              <TYPE.mediumHeader color={theme.ethereum}>Ethereum</TYPE.mediumHeader>
            </Network>
            <Row>
              <FeeCard title="Free" subtitle="Deposit fee" />
              <FeeCard title="0.05%" subtitle="Withdrawal fee" />
              <FeeCard title="1000 USD" subtitle="Withdrawal minimum" style={{ marginRight: 0 }} />
            </Row>
          </NetworkFee>
          <NetworkFee>
            <Network>
              <NetworkLogo src={bnbLogo} />
              <TYPE.mediumHeader color={theme.binance}>Binance</TYPE.mediumHeader>
            </Network>
            <Row>
              <FeeCard title="Free" subtitle="Deposit fee" />
              <FeeCard title="0.01%" subtitle="Withdrawal fee" />
              <FeeCard title="100 USD" subtitle="Withdrawal minimum" style={{ marginRight: 0 }} />
            </Row>
          </NetworkFee>
        </Body>
        <Footer>
          <InfoIcon />
          <TYPE.subHeader>The fees are taken to repay the network fees on the Ethereum network</TYPE.subHeader>
        </Footer>
      </AutoColumn>
    </Modal>
  )
}
