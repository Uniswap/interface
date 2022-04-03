import { EthereumMainnet, Kovan, Network } from '@celo-tools/use-contractkit'
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
    network: EthereumMainnet,
    token: new WrappedTokenInfo(
      {
        name: 'Wrapped Ether',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        symbol: 'WETH',
        decimals: 18,
        chainId: 1,
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
      []
    ),
    name: 'ethereum',
    prettyName: 'Ethereum',
    domain: 6648936,
    bridgeRouter: '0x6a39909e805A3eaDd2b61fFf61147796ca6aBB47',
  },
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
          network: Kovan,
          token: new WrappedTokenInfo(
            {
              name: 'Wrapped Ether',
              address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
              symbol: 'WETH',
              decimals: 18,
              chainId: 42,
              logoURI:
                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
            },
            []
          ),
          name: 'kovan',
          prettyName: 'Kovan',
          domain: 3000,
          bridgeRouter: '0x383Eb849c707fE38f3DfBF45679C0c6f21Ba82fF',
        },
      ]
    : []),
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
