import React, { Fragment, useContext, useState } from 'react'
import { ButtonPrimary } from 'components/Button'
import { useAirdrop } from 'state/airdrop/airdrop-hooks'
import styled, { ThemeContext } from 'styled-components'
import { Dots } from 'pages/Pool/styleds'
import { CheckCircle } from 'react-feather'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import { DIFFUSION } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks/web3'
import { Token } from 'sdk-core/entities'
import Tooltip from 'components/Tooltip'

const StyledAirdropbutton = styled(ButtonPrimary)`
  background-color: ${({ theme }) => theme.bg3};
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.darkTransparent2} 0%, ${theme.secondary1_10} 50%, ${theme.darkTransparent2} 100%);`};
  border: none;
  margin-bottom: 8px;
`

const ClaimingDots = styled(Dots)`
  color: white;
`

export function AirdropButton() {
  const { chainId } = useActiveWeb3React()
  const { isEligible, didClaim, loading, claim, isClaiming, didJustClaim, isPending } = useAirdrop()
  const [showHover, setShowHover] = useState(false)

  const diff = DIFFUSION[chainId!] as Token | undefined
  const { addToken, success: success } = useAddTokenToMetamask(diff)
  const theme = useContext(ThemeContext)

  if ((!isEligible || didClaim || loading) && !didJustClaim) {
    return (
      <Fragment>
        <Tooltip
          text="You are not eligible for the current Uniswap based Airdrop. The other airdrops will be announced shortly."
          show={!isEligible && showHover}
        >
          <div onMouseEnter={() => setShowHover(true)} onMouseLeave={() => setShowHover(false)}>
            <StyledAirdropbutton disabled>
              {loading ? (
                <ClaimingDots>loading</ClaimingDots>
              ) : !isEligible ? (
                'Not Eligible'
              ) : didClaim ? (
                'Already Claimed'
              ) : (
                <ClaimingDots>loading</ClaimingDots>
              )}
            </StyledAirdropbutton>
          </div>
        </Tooltip>
      </Fragment>
    )
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
