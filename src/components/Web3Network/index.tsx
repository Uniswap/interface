import React, { useRef } from 'react'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import { useModalOpen, useNetworkModalToggle } from '../../state/application/hooks'
import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import NetworkModal from '../NetworkModal'
import Card from 'components/Card'
import Row from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ApplicationModal } from 'state/application/actions'

const NetworkSwitchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const NetworkCard = styled(Card)`
  position: relative;
  background-color: ${({ theme }) => theme.bg12};
  color: ${({ theme }) => theme.primary};
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid transparent;
  min-width: 165px;

  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary};
    border-radius: 8px;
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    text-overflow: ellipsis;
    flex-shrink: 1;
    min-width: auto;
  `};
`

const NetworkLabel = styled.div`
  white-space: nowrap;
  margin-right: 1rem;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const DropdownIcon = styled.div<{ open: boolean }>`
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid ${({ theme }) => theme.primary};

  transform: rotate(${({ open }) => (open ? '180deg' : '0')});
  transition: transform 300ms;
`

function Web3Network(): JSX.Element | null {
  const { chainId } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, networkModalOpen ? toggleNetworkModal : undefined)

  if (!chainId) return null

  return (
    <NetworkCard onClick={() => toggleNetworkModal()} ref={node as any} role="button">
      <NetworkSwitchContainer>
        <Row>
          <img
            src={NETWORK_ICON[chainId]}
            alt="Switch Network"
            style={{ width: 24, height: 24, marginRight: '12px' }}
          />
          <NetworkLabel>{NETWORK_LABEL[chainId]}</NetworkLabel>
        </Row>
        <DropdownIcon open={networkModalOpen} />
      </NetworkSwitchContainer>
      <NetworkModal />
    </NetworkCard>
  )
}

export default Web3Network
