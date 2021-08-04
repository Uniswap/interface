import React, { useCallback, useEffect, useState } from 'react'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { AutoRow, RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonPrimary } from '../Button'
import { useActiveWeb3React } from '../../hooks'
import useUnclaimedSWPRBalance from '../../hooks/swpr/useUnclaimedSWPRBalance'
import { useShowClaimPopup } from '../../state/application/hooks'
import { transparentize } from 'polished'
import TransactionConfirmationModal, { TransactionErrorContent } from '../TransactionConfirmationModal'
import { ChainId, TokenAmount } from 'dxswap-sdk'
import useClaimCallback from '../../hooks/swpr/useClaimCallback'
import useIsClaimAvailable from '../../hooks/swpr/useIsClaimAvailable'
import { ExternalLink } from 'react-feather'
import { InjectedConnector } from '@web3-react/injected-connector'
import { switchOrAddNetwork } from '../../utils'
import { NETWORK_DETAIL } from '../../constants'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const UpperAutoColumn = styled(AutoColumn)`
  padding: 24px;
  background-color: ${({ theme }) => transparentize(0.45, theme.bg2)};
  backdrop-filter: blur(12px);
`

const BottomAutoColumn = styled(AutoColumn)`
  width: 100%;
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 8px;
  padding: 26px;
`

const StyledClaimButton = styled(ButtonPrimary)`
  color: ${props => props.theme.white} !important;
  background: linear-gradient(90deg, ${props => props.theme.primary1} -24.77%, #fb52a1 186.93%);
  :disabled {
    opacity: 0.5;
  }
`

const NetworkWarning = styled.div`
  width: 100%;
  background-color: rgba(242, 153, 74, 0.25);
  border-radius: 12px;
  padding: 20px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0em;
  margin-bottom: 12px;
  text-align: center;
  color: #f2994a;
`

export default function ClaimModal({
  onDismiss,
  swprBalance
}: {
  onDismiss: () => void
  swprBalance: TokenAmount | undefined
}) {
  const { account, chainId, connector } = useActiveWeb3React()

  const [attempting, setAttempting] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const [correctNetwork, setCorrectNetwork] = useState(false)
  const open = useShowClaimPopup()

  const claimCallback = useClaimCallback(account || undefined)
  const { unclaimedBalance } = useUnclaimedSWPRBalance(account || undefined)
  const { available: availableClaim } = useIsClaimAvailable(account || undefined)

  useEffect(() => {
    setCorrectNetwork(chainId === ChainId.ARBITRUM_RINKEBY)
  }, [chainId])

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
        setError(true)
        console.log(error)
      })
  }, [claimCallback])

  const wrappedOnDismiss = useCallback(() => {
    setAttempting(false)
    setError(false)
    setHash(undefined)
    onDismiss()
  }, [onDismiss])

  const onSwitchToArbitrum = useCallback(() => {
    if (connector instanceof InjectedConnector)
      switchOrAddNetwork(NETWORK_DETAIL[ChainId.ARBITRUM_RINKEBY], account || undefined)
  }, [account, connector])

  const content = () => {
    return error ? (
      <TransactionErrorContent onDismiss={wrappedOnDismiss} message="The claim wasn't successful" />
    ) : (
      <ContentWrapper gap="lg">
        <UpperAutoColumn gap="16px">
          <RowBetween>
            <TYPE.white fontWeight={500} fontSize="20px" lineHeight="24px" color="text4">
              Your SWPR details
            </TYPE.white>
            <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} />
          </RowBetween>
          <TYPE.white fontWeight={700} fontSize={36}>
            {swprBalance?.toFixed(3) || '0.000'}
          </TYPE.white>
          <TYPE.white fontWeight={600} fontSize="11px" lineHeight="13px" letterSpacing="0.08em" color="text4">
            TOTAL SWPR ON CURRENT NETWORK
          </TYPE.white>
        </UpperAutoColumn>
        <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
          <NetworkWarning>
            Receive your SWPR airdrop on Arbitrum network. Please switch network to claim.
          </NetworkWarning>
          <BottomAutoColumn gap="8px">
            <TYPE.small fontWeight={600} fontSize="11px" lineHeight="13px" letterSpacing="0.08em" color="text5">
              UNCLAIMED SWPR
            </TYPE.small>
            <TYPE.white fontWeight={700} fontSize="22px" lineHeight="27px">
              {unclaimedBalance?.toFixed(3) || '0'} SWPR
            </TYPE.white>
            <StyledClaimButton
              disabled={!availableClaim}
              padding="16px 16px"
              width="100%"
              mt="1rem"
              onClick={
                !correctNetwork && connector instanceof InjectedConnector
                  ? onSwitchToArbitrum
                  : availableClaim
                  ? onClaim
                  : undefined
              }
            >
              {correctNetwork ? 'Claim SWPR' : 'Switch to Arbitrum Rinkeby'}
            </StyledClaimButton>
          </BottomAutoColumn>
          <AutoRow gap="3px" justifyContent="center" width="100%">
            <TYPE.small fontSize="13px" fontWeight="400px" lineHeight="16px">
              Read about the airdrop
            </TYPE.small>
            <ExternalLink size="12px" />
          </AutoRow>
        </AutoColumn>
      </ContentWrapper>
    )
  }

  return (
    <TransactionConfirmationModal
      isOpen={open}
      onDismiss={wrappedOnDismiss}
      attemptingTxn={attempting}
      hash={hash}
      content={content}
      pendingText={`Claiming ${unclaimedBalance?.toFixed(3)} SWPR`}
    />
  )
}
