import React, { useCallback, useEffect, useState } from 'react'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonDark1, ButtonPrimary, ButtonPurple } from '../Button'
import { useActiveWeb3React } from '../../hooks'
import { useShowClaimPopup } from '../../state/application/hooks'
import { transparentize } from 'polished'
import TransactionConfirmationModal, { TransactionErrorContent } from '../TransactionConfirmationModal'
import { ChainId, TokenAmount } from '@swapr/sdk'
import { ExternalLink as ExternalLinkIcon } from 'react-feather'
import { useNativeCurrencyBalance } from '../../state/wallet/hooks'
import { useIsOldSwaprLp } from '../../hooks/swpr/useIsOldSwaprLp'
import { ConvertFlow } from './ConvertFlow'
import useDebounce from '../../hooks/useDebounce'
import { AddTokenButton } from '../AddTokenButton/AddTokenButton'
import { Flex } from 'rebass'
import { useHistory } from 'react-router'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  background-color: ${({ theme }) => theme.bg1};
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

const NativeCurrencyWarning = styled.div`
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  line-height: 17px;
  letter-spacing: 0em;
  margin-bottom: 12px;
  color: ${props => props.theme.red1};
`

const SpacedExternalLinkIcon = styled(ExternalLinkIcon)`
  margin-left: 6px;
`

export default function ClaimModal({
  onDismiss,
  oldSwprBalance,
  newSwprBalance,
  stakedAmount,
  singleSidedCampaignLink
}: {
  onDismiss: () => void
  oldSwprBalance?: TokenAmount
  newSwprBalance?: TokenAmount
  stakedAmount?: string | null
  singleSidedCampaignLink?: string
}) {
  const { account, chainId } = useActiveWeb3React()
  const { push } = useHistory()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const [correctNetwork, setCorrectNetwork] = useState(false)
  const open = useShowClaimPopup()

  const nativeCurrencyBalance = useNativeCurrencyBalance()
  const { loading: loadingIsOldSwaprLp, isOldSwaprLp } = useIsOldSwaprLp(account || undefined)

  const debouncedLoadingIsOldSwaprLP = useDebounce(loadingIsOldSwaprLp, 1000)
  const debouncedIsOldSwaprLP = useDebounce(isOldSwaprLp, 1000)

  useEffect(() => {
    setCorrectNetwork(chainId === ChainId.ARBITRUM_ONE)
  }, [chainId])

  const handleConversionError = useCallback(() => {
    setError(true)
  }, [])

  const wrappedOnDismiss = useCallback(() => {
    setAttempting(false)
    setError(false)
    setHash(undefined)
    onDismiss()
  }, [onDismiss])

  const handleStakeUnstakeClick = () => {
    if (singleSidedCampaignLink) {
      push({ pathname: '/rewards', state: { showSwpr: true } })
      wrappedOnDismiss()
    }
  }

  const content = () => {
    if (error) {
      return <TransactionErrorContent onDismiss={wrappedOnDismiss} message="The operation wasn't successful" />
    } else
      return (
        <ContentWrapper gap="lg">
          <UpperAutoColumn gap="26px">
            <RowBetween>
              <TYPE.white fontWeight={500} fontSize="20px" lineHeight="24px" color="text4">
                Your SWPR details
              </TYPE.white>
              <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} />
            </RowBetween>
            <RowBetween>
              <Flex width="50%" flexDirection="column">
                <TYPE.white fontWeight={700} fontSize={26}>
                  {newSwprBalance?.toFixed(3) || '0.000'}
                </TYPE.white>
                <TYPE.body marginTop="4px" marginBottom="11px" fontWeight="600" fontSize="11px">
                  SWPR
                </TYPE.body>
                <ButtonPurple onClick={handleStakeUnstakeClick}>STAKE</ButtonPurple>
              </Flex>

              <Flex width="50%" flexDirection="column">
                <TYPE.white fontWeight={700} fontSize={26}>
                  {stakedAmount ? parseFloat(stakedAmount).toFixed(3) : '0.000'}
                </TYPE.white>
                <TYPE.body marginTop="4px" marginBottom="11px" fontWeight="600" fontSize="11px">
                  STAKED SWPR
                </TYPE.body>
                <ButtonDark1 onClick={handleStakeUnstakeClick}>UNSTAKE</ButtonDark1>
              </Flex>
            </RowBetween>
          </UpperAutoColumn>
          <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
            {correctNetwork && debouncedIsOldSwaprLP && (
              <NativeCurrencyWarning>
                Seems like you have provided liquidity on the old Swapr build. Please pull all the provided liquidity
                and come back to swapr.eth to proceed.
              </NativeCurrencyWarning>
            )}

            {oldSwprBalance?.greaterThan('0') && (
              <BottomAutoColumn gap="8px">
                <RowBetween>
                  <div>
                    <TYPE.small fontWeight={600} fontSize="11px" lineHeight="13px" letterSpacing="0.08em" color="text5">
                      UNCLAIMED SWPR (OLD)
                    </TYPE.small>
                    <TYPE.white fontWeight={700} fontSize="22px" lineHeight="27px">
                      0
                    </TYPE.white>
                  </div>
                  <div>
                    <TYPE.small fontWeight={600} fontSize="11px" lineHeight="13px" letterSpacing="0.08em" color="text5">
                      UNCONVERTED SWPR (OLD)
                    </TYPE.small>
                    <TYPE.white fontWeight={700} fontSize="22px" lineHeight="27px">
                      {oldSwprBalance?.toFixed(3) || '0'}
                    </TYPE.white>
                  </div>
                </RowBetween>
                {!debouncedIsOldSwaprLP && correctNetwork && nativeCurrencyBalance?.equalTo('0') && (
                  <>
                    <NativeCurrencyWarning>
                      You have no Arbitrum ETH to perform the operation. Please make sure to transfer enough ETH to
                      Arbitrum using the official bridge in order to complete the transaction.
                    </NativeCurrencyWarning>
                    <ButtonPrimary
                      as="a"
                      href="http://bridge.arbitrum.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      padding="16px 16px"
                    >
                      Arbitrum bridge <SpacedExternalLinkIcon size="12px" />
                    </ButtonPrimary>
                  </>
                )}
                {correctNetwork && (oldSwprBalance?.greaterThan('0') || isOldSwaprLp) && (
                  <ConvertFlow
                    disabled={debouncedLoadingIsOldSwaprLP || debouncedIsOldSwaprLP}
                    oldSwprBalance={oldSwprBalance}
                    onError={handleConversionError}
                  />
                )}
              </BottomAutoColumn>
            )}
            <AddTokenButton
              active={!debouncedIsOldSwaprLP && oldSwprBalance?.equalTo('0') && newSwprBalance?.greaterThan('0')}
            />
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
      pendingText={`Claiming 0 SWPR`}
    />
  )
}
