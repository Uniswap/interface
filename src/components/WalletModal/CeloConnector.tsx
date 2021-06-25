import { ChainId } from '@ubeswap/sdk'
import React from 'react'
import { Button } from 'theme'

import { NETWORK_CHAIN_ID } from '../../connectors'

const CELO_PARAMS = {
  chainId: '0xa4ec',
  chainName: 'Celo',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: ['https://forno.celo.org'],
  blockExplorerUrls: ['https://explorer.celo.org/'],
  iconUrls: ['future'],
}

const ALFAJORES_PARAMS = {
  chainId: '0xaef3',
  chainName: 'Alfajores Testnet',
  nativeCurrency: { name: 'Alfajores Celo', symbol: 'A-CELO', decimals: 18 },
  rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
  blockExplorerUrls: ['https://alfajores-blockscout.celo-testnet.org/'],
  iconUrls: ['future'],
}

const BAKLAVA_PARAMS = {
  chainId: '0xf370',
  chainName: 'Baklava Testnet',
  nativeCurrency: { name: 'Baklava Celo', symbol: 'B-CELO', decimals: 18 },
  rpcUrls: ['https://baklava-forno.celo-testnet.org'],
  blockExplorerUrls: ['https://baklava-blockscout.celo-testnet.org/'],
  iconUrls: ['future'],
}

const params: { [chain in ChainId]: typeof CELO_PARAMS } = {
  [ChainId.MAINNET]: CELO_PARAMS,
  [ChainId.ALFAJORES]: ALFAJORES_PARAMS,
  [ChainId.BAKLAVA]: BAKLAVA_PARAMS,
}

export const CeloConnector: React.FC = () => {
  const chainParams = params[NETWORK_CHAIN_ID]
  return (
    <Button
      onClick={async () => {
        await window.ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [chainParams],
        })
      }}
    >
      Switch to the {chainParams.chainName} network
    </Button>
  )
}
