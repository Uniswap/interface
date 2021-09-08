import React from 'react'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import { useNetworkModalToggle } from '../../state/application/hooks'
import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import NetworkModal from '../NetworkModal'
import { YellowCard } from 'components/Card'

const NetworkSwitchContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`

const NetworkCard = styled(YellowCard)`
  border-radius: 12px;
  padding: 12px 20px;
  border: 1px solid transparent;

  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.yellow2};
    border-radius: 8px;
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`

function Web3Network(): JSX.Element | null {
  const { chainId, library } = useActiveWeb3React()

  const toggleNetworkModal = useNetworkModalToggle()

  if (!chainId) return null

  return (
    <NetworkCard onClick={() => toggleNetworkModal()}>
      <NetworkSwitchContainer>
        <img src={NETWORK_ICON[chainId]} alt="Switch Network" style={{ width: 22, height: 22, marginRight: '1rem' }} />
        <div>{NETWORK_LABEL[chainId]}</div>
      </NetworkSwitchContainer>
      <NetworkModal isNotConnected={!(library && library.provider && library.provider.isMetaMask)} />
    </NetworkCard>
  )
}

export default Web3Network
