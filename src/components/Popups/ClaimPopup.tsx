import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useCallback, useEffect } from 'react'
import { Heart, X } from 'react-feather'
import ReactGA from 'react-ga'
import styled, { keyframes } from 'styled-components/macro'

import tokenLogo from '../../assets/images/token-logo.png'
import { useActiveWeb3React } from '../../hooks/web3'
import {
  useModalOpen,
  useShowClaimPopup,
  useToggleSelfClaimModal,
  useToggleShowClaimPopup,
} from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from '../../state/claim/hooks'
import { ThemedText } from '../../theme'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import { CardBGImage, CardNoise } from '../earn/styled'

const StyledClaimPopup = styled(AutoColumn)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #021d43 100%);
  border-radius: 20px;
  padding: 1.5rem;
  overflow: hidden;
  position: relative;
  max-width: 360px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`

const StyledClose = styled(X)`
  position: absolute;
  right: 10px;
  top: 10px;

  :hover {
    cursor: pointer;
  }
`

const rotate = keyframes`
  0% {
    transform: perspective(1000px) rotateY(0deg);
  }

  100% {
    transform: perspective(1000px) rotateY(360deg);
  }
`

const UniToken = styled.img`
  animation: ${rotate} 5s cubic-bezier(0.83, 0, 0.17, 1) infinite;
`

export default function ClaimPopup() {
  const { account } = useActiveWeb3React()

  // dont store these in persisted state yet
  const showClaimPopup: boolean = useShowClaimPopup()
  const toggleShowClaimPopup = useToggleShowClaimPopup()

  // toggle for showing this modal
  const showClaimModal = useModalOpen(ApplicationModal.SELF_CLAIM)
  const toggleSelfClaimModal = useToggleSelfClaimModal()
  const handleToggleSelfClaimModal = useCallback(() => {
    ReactGA.event({
      category: 'MerkleDrop',
      action: 'Toggle self claim modal',
    })
    toggleSelfClaimModal()
  }, [toggleSelfClaimModal])

  // const userHasAvailableclaim = useUserHasAvailableClaim()
  const userHasAvailableclaim: boolean = useUserHasAvailableClaim(account)
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)

  // listen for available claim and show popup if needed
  useEffect(() => {
    if (userHasAvailableclaim) {
      ReactGA.event({
        category: 'MerkleDrop',
        action: 'Show claim popup',
      })
      toggleShowClaimPopup()
    }
    // the toggleShowClaimPopup function changes every time the popup changes, so this will cause an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userHasAvailableclaim])

  return (
    <>
      {showClaimPopup && !showClaimModal && (
        <StyledClaimPopup gap="md">
          <CardBGImage />
          <CardNoise />
          <StyledClose stroke="white" onClick={toggleShowClaimPopup} />
          <AutoColumn style={{ padding: '2rem 0', zIndex: 10 }} justify="center">
            <UniToken width="48px" src={tokenLogo} />{' '}
            <ThemedText.White style={{ marginTop: '1rem' }} fontSize={36} fontWeight={600}>
              {unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')} UNI
            </ThemedText.White>
            <ThemedText.White style={{ paddingTop: '1.25rem', textAlign: 'center' }} fontWeight={600} color="white">
              <span role="img" aria-label="party">
                🎉
              </span>{' '}
              <Trans>UNI has arrived</Trans>{' '}
              <span role="img" aria-label="party">
                🎉
              </span>
            </ThemedText.White>
            <ThemedText.SubHeader style={{ paddingTop: '0.5rem', textAlign: 'center' }} color="white">
              <Trans>
                Thanks for being part of the Uniswap community <Heart size={12} />
              </Trans>
            </ThemedText.SubHeader>
          </AutoColumn>
          <AutoColumn style={{ zIndex: 10 }} justify="center">
            <ButtonPrimary padding="8px" $borderRadius="8px" width={'fit-content'} onClick={handleToggleSelfClaimModal}>
              <Trans>Claim your UNI tokens</Trans>
            </ButtonPrimary>
          </AutoColumn>
        </StyledClaimPopup>
      )}
    </>
  )
}
