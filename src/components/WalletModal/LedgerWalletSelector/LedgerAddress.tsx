import { cUSD } from '@ubeswap/sdk'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { NETWORK_CHAIN_ID } from 'connectors'
import { LedgerConnector, LedgerKit } from 'connectors/ledger/LedgerConnector'
import React from 'react'
import { useTokenBalance } from 'state/wallet/hooks'
import { shortenAddress } from 'utils'
import { InfoCard } from '.'

interface Props {
  index: number
  address: string
  kit: LedgerKit
  tryActivation: (connector: AbstractConnector | undefined) => Promise<void>
}

export const LedgerAddress = ({ address, kit, tryActivation, index }: Props) => {
  const cusdBalance = useTokenBalance(address, cUSD[NETWORK_CHAIN_ID])
  return (
    <InfoCard
      onClick={() => {
        const connector = new LedgerConnector({ kit, index })
        tryActivation(connector)
      }}
    >
      <span>{shortenAddress(address)}</span>
      <span>{cusdBalance?.toFixed(2) ?? '0.00'} cUSD</span>
    </InfoCard>
  )
}
