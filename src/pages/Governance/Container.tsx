import { Currency } from 'dxswap-sdk'
import React from 'react'
import { AutoRowCleanGap } from '../../components/Row'

import { GovernanceCard } from './Card'

export default function Container() {
  const USDC: Currency = {
    decimals: 18,
    name: 'USD Coin',
    symbol: 'USDC'
  }
  const DXD: Currency = {
    decimals: 18,
    name: 'DXdao',
    symbol: 'DXD'
  }
  const DMG: Currency = {
    decimals: 18,
    name: 'DMM: Governance',
    symbol: 'DMG'
  }
  const SNT: Currency = {
    decimals: 18,
    name: 'Status',
    symbol: 'SNT'
  }
  const RARI: Currency = {
    decimals: 18,
    name: 'Rarible',
    symbol: 'RARI'
  }
  const DAI: Currency = {
    decimals: 18,
    name: 'Dai',
    symbol: 'DAI'
  }
  const USDT: Currency = {
    decimals: 18,
    name: 'Tether',
    symbol: 'USDT'
  }

  return (
    <AutoRowCleanGap gap={8}>
      <GovernanceCard name="USDC" pairs={15} proposals={1} currency={USDC} />
      <GovernanceCard name="DXD" pairs={4} proposals={32} currency={DXD} />
      <GovernanceCard name="DMG" pairs={5} proposals={3} currency={DMG} />
      <GovernanceCard name="SNT" pairs={1} currency={SNT} />
      <GovernanceCard name="RARI" pairs={5} currency={RARI} />
      <GovernanceCard name="DAI" pairs={5} currency={DAI} />
      <GovernanceCard name="USDT" pairs={22} currency={USDT} />
    </AutoRowCleanGap>
  )
}
