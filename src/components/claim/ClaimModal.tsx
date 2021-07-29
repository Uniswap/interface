import React, { useCallback, useState } from 'react'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonPrimary } from '../Button'
import { useActiveWeb3React } from '../../hooks'
import useUnclaimedSWPRBalance from '../../hooks/useUnclaimedSWPRBalance'
import useIsClaimAvailable from '../../hooks/useIsClaimAvailable'
import useClaimCallback from '../../hooks/useClaimCallback'
import { useShowClaimPopup } from '../../state/application/hooks'
import { transparentize } from 'polished'
import TransactionConfirmationModal from '../TransactionConfirmationModal'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const UpperAutoColumn = styled(AutoColumn)`
  padding: 24px;
  background-color: ${({ theme }) => transparentize(0.45, theme.bg2)};
`

export default function ClaimModal({ onDismiss }: { onDismiss: () => void }) {
  const { account } = useActiveWeb3React()

  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const open = useShowClaimPopup()

  const claimCallback = useClaimCallback(account || undefined)
  const { unclaimedBalance } = useUnclaimedSWPRBalance(account || undefined)
  const { available: availableClaim } = useIsClaimAvailable(account || undefined)

  const onClaim = useCallback(() => {
    setAttempting(true)
    claimCallback()
      .then(transaction => {
        setHash(transaction.hash)
        transaction
          .wait()
          .then(() => {
            setAttempting(false)
          })
          .catch(() => {
            console.error('error submitting tx')
          })
      })
      .catch(error => {
        setAttempting(false)
        console.log(error)
      })
  }, [claimCallback])

  const wrappedOnDismiss = () => {
    setAttempting(false)
    setHash(undefined)
    onDismiss()
  }

  const content = () => {
    return (
      <ContentWrapper gap="lg">
        <UpperAutoColumn gap="16px">
          <RowBetween>
            <TYPE.white fontWeight={500}>Claim SWPR Token</TYPE.white>
            <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} />
          </RowBetween>
          <TYPE.white fontWeight={700} fontSize={36}>
            {unclaimedBalance?.toFixed(3)} SWPR
          </TYPE.white>
        </UpperAutoColumn>
        <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
          <ButtonPrimary
            disabled={!availableClaim}
            padding="16px 16px"
            width="100%"
            borderRadius="12px"
            mt="1rem"
            onClick={onClaim}
          >
            Claim SWPR
          </ButtonPrimary>
        </AutoColumn>
      </ContentWrapper>
    )
  }

  return (
    <TransactionConfirmationModal
      isOpen={open}
      onDismiss={onDismiss}
      attemptingTxn={attempting}
      hash={hash}
      content={content}
      pendingText={`Claiming ${unclaimedBalance?.toFixed(3)} SWPR`}
    />
  )
}
