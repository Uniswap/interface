import { Trans, t } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import React, { useContext } from 'react'
import { Flex, Text } from 'rebass'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ThemeContext } from 'styled-components'
import { KNC } from '../../constants'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ButtonPrimary } from 'components/Button'
import { shortenAddress } from 'utils'
import useClaimReward from 'hooks/useClaimReward'
import styled from 'styled-components'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { CloseIcon } from 'theme'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'

const AddressWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 8px;
  padding: 12px;
  overflow: hidden;
  p {
    margin: 12px 0 0 0;
    font-size: 24px;
    line-height: 28px;
    font-weight: 500;
    color: ${({ theme }) => theme.disableText};
  }
`
function ClaimRewardModal() {
  const { chainId, account } = useActiveWeb3React()
  const open = useModalOpen(ApplicationModal.CLAIM_POPUP)
  const toggle = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const theme = useContext(ThemeContext)
  const {
    isUserHasReward,
    rewardAmounts,
    claimRewardsCallback,
    attemptingTxn,
    txHash,
    pendingTx,
    error: claimRewardError,
    resetTxn,
  } = useClaimReward()
  const KNCToken = KNC[(chainId as ChainId) || ChainId.MAINNET]
  const isCanClaim = isUserHasReward && rewardAmounts !== '0' && !pendingTx

  const modalContent = () =>
    claimRewardError ? (
      <TransactionErrorContent
        onDismiss={() => {
          toggle()
          setTimeout(() => resetTxn(), 1000)
        }}
        message={claimRewardError}
      />
    ) : (
      <Flex flexDirection={'column'} padding="26px 24px" style={{ gap: '25px' }}>
        <RowBetween>
          <Text fontSize={20} fontWeight={500} color={theme.text}>
            <Trans>Claim your rewards</Trans>
          </Text>
          <CloseIcon onClick={toggle} />
        </RowBetween>

        <AddressWrapper>
          <Text color={theme.subText} fontSize={12}>
            <Trans>Your wallet address</Trans>
          </Text>
          <p>{account && shortenAddress(account, 9)}</p>
        </AddressWrapper>
        <Text fontSize={16} lineHeight="24px" color={theme.text}>
          <Trans>If your wallet is eligible, you will be able to claim your reward below. You can claim:</Trans>
        </Text>
        <Text fontSize={32} lineHeight="38px" fontWeight={500}>
          <CurrencyLogo currency={KNCToken} /> {rewardAmounts} KNC
        </Text>
        <ButtonPrimary disabled={!isCanClaim} onClick={claimRewardsCallback}>
          <Trans>Claim</Trans>
        </ButtonPrimary>
      </Flex>
    )

  return (
    <TransactionConfirmationModal
      isOpen={open}
      onDismiss={() => {
        toggle()
      }}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={modalContent}
      pendingText={t`Claiming ${rewardAmounts} KNC`}
    />
  )
}

export default ClaimRewardModal
