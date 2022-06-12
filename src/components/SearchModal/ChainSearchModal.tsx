import { Network } from '@celo-tools/use-contractkit'
import CurrencyLogo from 'components/CurrencyLogo'
import React, { useCallback } from 'react'
import { WrappedTokenInfo } from 'state/lists/hooks'
import styled from 'styled-components'

import { Alfajores, Mainnet } from '../../networks'
import Modal from '../Modal'

const ChainSelect = styled.div({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 64px',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  cursor: 'pointer',
  borderRadius: '20px',
  ':hover': {
    opacity: 0.7,
  },
  width: '100%',
  marginBottom: '16px',
})

export type Chain = {
  network: Network
  token: WrappedTokenInfo
  name: string
  prettyName: string
  domain: number
  bridgeRouter: string
}

export const chains: Chain[] = [
  {
    network: Mainnet,
    token: new WrappedTokenInfo(
      {
        address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
        name: 'Celo',
        symbol: 'CELO',
        chainId: 42220,
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_CELO.png',
      },
      []
    ),
    name: 'celo',
    prettyName: 'Celo',
    domain: 1667591279,
    bridgeRouter: '0xf244eA81F715F343040569398A4E7978De656bf6',
  },
  ...(process.env.NODE_ENV !== 'production'
    ? [
        {
          network: Alfajores,
          token: new WrappedTokenInfo(
            {
              address: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
              name: 'Celo',
              symbol: 'CELO',
              chainId: 44787,
              decimals: 18,
              logoURI: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_CELO.png',
            },
            []
          ),
          name: 'alfajores',
          prettyName: 'Alfajores',
          domain: 1000,
          bridgeRouter: '0xdaa6e362f9BE0CDaCe107b298639034b8dEC617a',
        },
      ]
    : []),
]

interface ChainSearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  onChainSelect: (chain: Chain) => void
  selectedChain?: Chain | null
}

export default function ChainSearchModal({ isOpen, onDismiss, onChainSelect }: ChainSearchModalProps) {
  const handleChainSelect = useCallback(
    (chain: Chain) => {
      onChainSelect(chain)
      onDismiss()
    },
    [onDismiss, onChainSelect]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={60} minHeight={60}>
      <div style={{ padding: '48px', width: '100%' }}>
        <div style={{ marginBottom: '16px' }}>
          <span>Select chain</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {chains.map((chain, idx) => (
            <ChainSelect key={idx} onClick={() => handleChainSelect(chain)}>
              <CurrencyLogo currency={chain.token} style={{ marginRight: '8px' }} />
              <span>{chain.prettyName}</span>
            </ChainSelect>
          ))}
        </div>
      </div>
    </Modal>
  )
}
