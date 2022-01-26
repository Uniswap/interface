import { TokenAmount } from '@swapr/sdk'
import React from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../../hooks'
import { Amount } from '../index'

const StakeIndicator = styled.div`
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, #2e17f2 -24.77%, #fb52a1 186.93%);
  border-radius: 0px 8px 8px 0px;
  padding: 6px 12px;
  font-weight: bold;
  font-size: 10px;
  line-height: 10px;
  cursor: pointer;
`
const Wrapper = styled.div`
  display: flex;
  margin-right: 7px;
  border-radius: 15px 50px 30px 5px;
`

interface SwprInfoProps {
  newSwprBalance?: TokenAmount
  onToggleClaimPopup: () => void
  hasActiveCampaigns: boolean
}

export function SwprInfo({ onToggleClaimPopup, newSwprBalance, hasActiveCampaigns }: SwprInfoProps) {
  const { account } = useActiveWeb3React()

  return (
    <Wrapper onClick={onToggleClaimPopup}>
      <Amount borderRadius={hasActiveCampaigns ? '8px 0px 0px 8px !important;' : ''} zero={false} clickable>
        {!account || !newSwprBalance ? '0.000' : newSwprBalance.toFixed(3)} SWPR
      </Amount>
      {hasActiveCampaigns && <StakeIndicator>STAKE</StakeIndicator>}
    </Wrapper>
  )
}
