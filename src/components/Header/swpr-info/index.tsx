import { TokenAmount } from '@swapr/sdk'
import React from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../../hooks'
import { useIsOldSwaprLp } from '../../../hooks/swpr/useIsOldSwaprLp'
import useDebounce from '../../../hooks/useDebounce'
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
  oldSwprBalance?: TokenAmount
  newSwprBalance?: TokenAmount
  onToggleClaimPopup: () => void
  hasActiveCampaigns: boolean
}

export function SwprInfo({ onToggleClaimPopup, oldSwprBalance, newSwprBalance, hasActiveCampaigns }: SwprInfoProps) {
  const { account } = useActiveWeb3React()
  const { isOldSwaprLp } = useIsOldSwaprLp(account || undefined)

  const debouncedOldSwprBalance = useDebounce(oldSwprBalance, 1000)
  const debouncedIsOldSwaprLp = useDebounce(isOldSwaprLp, 1000)

  if (debouncedIsOldSwaprLp || debouncedOldSwprBalance?.greaterThan('0'))
    return (
      <AirdropSign onClick={onToggleClaimPopup}>
        <span role="img" aria-label="Convert SWPR emoji">
          ✨
        </span>{' '}
        Convert to new SWPR
      </AirdropSign>
    )
  return (
    <Wrapper onClick={onToggleClaimPopup}>
      <Amount borderRadius={hasActiveCampaigns ? '8px 0px 0px 8px !important;' : ''} zero={false} clickable>
        {!account || !newSwprBalance ? '0.000' : newSwprBalance.toFixed(3)} SWPR
      </Amount>
      {hasActiveCampaigns && <StakeIndicator>STAKE</StakeIndicator>}
    </Wrapper>
  )
}
