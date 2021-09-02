import React, { useCallback, useEffect, useState } from 'react'
import { CurrencyAmount } from '@swapr/sdk'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../../hooks'
import { ButtonPrimary } from '../../Button'
import { InjectedConnector } from '@web3-react/injected-connector'

const StyledClaimButton = styled(ButtonPrimary)`
  color: ${props => props.theme.white} !important;
  background: linear-gradient(90deg, ${props => props.theme.primary1} -24.77%, #fb52a1 186.93%);
  :disabled {
    opacity: 0.5;
  }
`

interface ActionButtonProps {
  availableClaim: boolean
  nativeCurrencyBalance?: CurrencyAmount
  correctNetwork: boolean
  onConnectWallet: () => void
  onSwitchToArbitrum: () => void
  onClaim: () => void
}

export function ActionButton({
  availableClaim,
  nativeCurrencyBalance,
  correctNetwork,
  onConnectWallet,
  onSwitchToArbitrum,
  onClaim
}: ActionButtonProps) {
  const { account, chainId, connector } = useActiveWeb3React()

  const [disabled, setDisabled] = useState(true)
  const [text, setText] = useState('Claim SWPR')

  useEffect(() => {
    let localDisabled = true
    if (!!!account) localDisabled = false
    // this else if handles cases where no airdrop nor conversion is available,
    // or when the user is in the correct network but no native currency
    // balance is there
    else if (!availableClaim || (correctNetwork && nativeCurrencyBalance?.equalTo('0'))) localDisabled = true
    else localDisabled = false
    setDisabled(localDisabled)
  }, [account, availableClaim, chainId, correctNetwork, nativeCurrencyBalance])

  useEffect(() => {
    let buttonText = 'Claim SWPR'
    if (!!!account) buttonText = 'Connect wallet'
    else if (!correctNetwork) buttonText = 'Switch to Arbitrum'
    else if (availableClaim) buttonText = 'Claim SWPR'
    setText(buttonText)
  }, [account, availableClaim, correctNetwork])

  const handleLocalClick = useCallback(() => {
    if (!account) onConnectWallet()
    else if (!correctNetwork && connector instanceof InjectedConnector) onSwitchToArbitrum()
    else if (availableClaim) onClaim()
  }, [account, onConnectWallet, correctNetwork, connector, onSwitchToArbitrum, availableClaim, onClaim])

  return (
    <StyledClaimButton disabled={disabled} padding="16px 16px" width="100%" mt="1rem" onClick={handleLocalClick}>
      {text}
    </StyledClaimButton>
  )
}
