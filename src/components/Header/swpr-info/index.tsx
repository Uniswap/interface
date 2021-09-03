import { TokenAmount } from '@swapr/sdk'
import React from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../../hooks'
import useIsClaimAvailable from '../../../hooks/swpr/useIsClaimAvailable'
import { Amount } from '../index'

const AirdropSign = styled.div`
  padding: 8px 12px;
  margin: 0;
  font-family: Montserrat;
  font-size: 10px;
  font-weight: 700;
  line-height: 10px;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  color: ${({ theme }) => theme.white};
  background: linear-gradient(90deg, #2e17f2 -24.77%, #fb52a1 186.93%);
  box-shadow: 0px 0px 42px rgba(165, 58, 196, 0.35);
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
  margin-right: 7px;
`

interface SwprInfoProps {
  oldSwprBalance?: TokenAmount
  newSwprBalance?: TokenAmount
  onToggleClaimPopup: () => void
}

export function SwprInfo({ onToggleClaimPopup, oldSwprBalance, newSwprBalance }: SwprInfoProps) {
  const { account } = useActiveWeb3React()
  const { available: claimAvailable } = useIsClaimAvailable(account)

  if (claimAvailable)
    return (
      <AirdropSign onClick={onToggleClaimPopup}>
        <span role="img" aria-label="Airdrop emoji">
          ✨
        </span>{' '}
        Claim SWPR airdrop and convert
      </AirdropSign>
    )
  if (oldSwprBalance && oldSwprBalance.greaterThan('0'))
    return (
      <AirdropSign onClick={onToggleClaimPopup}>
        <span role="img" aria-label="Convert SWPR emoji">
          ✨
        </span>{' '}
        Convert to new SWPR
      </AirdropSign>
    )
  return (
    <Amount zero={false} clickable onClick={onToggleClaimPopup}>
      {!account || !newSwprBalance ? '0.000' : newSwprBalance.toFixed(3)} SWPR
    </Amount>
  )
}
