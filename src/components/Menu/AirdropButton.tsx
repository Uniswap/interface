import React, { Fragment, useContext } from 'react'
import { ButtonPrimary } from 'components/Button'
import { useAirdrop } from 'state/airdrop/airdrop-hooks'
import styled, { ThemeContext } from 'styled-components'
import { Dots } from 'pages/Pool/styleds'
import { CheckCircle } from 'react-feather'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import { DIFFUSION } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks/web3'
import { Token } from 'sdk-core/entities'

const StyledAirdropbutton = styled(ButtonPrimary)`
  background-color: ${({ theme }) => theme.bg3};
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
  border: none;
  margin-bottom: 8px;
`

const ClaimingDots = styled(Dots)`
  color: white;
`

export function AirdropButton() {
  const { chainId } = useActiveWeb3React()
  const { isEligable, didClaim, loading, claim, isClaiming, didJustClaim, isPending } = useAirdrop()

  const diff = DIFFUSION[chainId!] as Token | undefined
  const { addToken, success: success } = useAddTokenToMetamask(diff)
  const theme = useContext(ThemeContext)

  if ((!isEligable || didClaim || loading) && !didJustClaim) {
    return null
  }

  return (
    <Fragment>
      {didJustClaim && !isPending ? (
        success ? (
          <StyledAirdropbutton>
            Added DIFF <CheckCircle size={'16px'} stroke={theme.green1} style={{ marginLeft: '6px' }} />
          </StyledAirdropbutton>
        ) : (
          <StyledAirdropbutton onClick={addToken}>Add DIFF to Metamask</StyledAirdropbutton>
        )
      ) : (
        <StyledAirdropbutton disabled={isClaiming} onClick={claim}>
          {isClaiming || isPending ? <ClaimingDots>claiming</ClaimingDots> : 'Claim Airdrop'}
        </StyledAirdropbutton>
      )}
    </Fragment>
  )
}
