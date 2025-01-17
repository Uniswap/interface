/* eslint-disable @typescript-eslint/no-unused-vars */
import { BigNumber } from '@ethersproject/bignumber'
import { InterfacePageName } from '@ubeswap/analytics-events'
import { ChainId } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonPrimary } from 'components/Button'
import Row from 'components/Row'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import { useToken } from 'hooks/Tokens'
import { useUbestarterLaunchpadV1 } from 'hooks/useContract'
import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { getUserSignatureAtom } from 'pages/LaunchpadCreate/launchpad-state'
import { LaunchpadDetails } from 'pages/LaunchpadList/data/useLaunchpads'
import { useCallback, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import LaunchpadBuyModal from './LaunchpadBuyModal'
import { useCreateLiquidity, useOwnerClaim, useOwnerRefund, useUserClaim, useUserRefund } from './launchpad-actions'

export const RowBetweenRelative = styled(Row)`
  justify-content: space-between;
  position: relative;
`

export const TwoColumnAuto = styled(Row)<{ gap?: string; justify?: string }>`
  flex-wrap: wrap;
  column-gap: 20px;

  & > * {
    width: calc(50% - 10px);
  }

  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
    & > * {
      width: 100%;
    }
  }
`
const ConnectWalletButton = styled(ButtonPrimary)`
  width: min-content;
  white-space: nowrap;
  border-radius: 12px;
  padding: 14px 18px;
  border: none;
`

export default function LaunchpadAction({
  launchpadAddress,
  launchpad,
  onBuy,
}: {
  launchpadAddress: string
  launchpad: LaunchpadDetails
  onBuy: () => void
}) {
  const { account } = useWeb3React()
  const isOwner = account?.toLowerCase() == launchpad.options.tokenSale.owner.toLowerCase()
  const theme = useTheme()
  const [drawerOpen, toggleWalletDrawer] = useAccountDrawer()

  const [signature] = useAtom(getUserSignatureAtom(account))
  const isSignatureValid = !!signature && signature.length > 5

  const token = useToken(launchpad.options.tokenInfo.tokenAddress, ChainId.CELO)
  const quoteTtken = useToken(launchpad.options.tokenSale.quoteToken, ChainId.CELO)
  const launchpadTokenBalance = useTokenBalance(launchpadAddress, token)
  const launchpadQuoteBalance = useTokenBalance(launchpadAddress, quoteTtken)
  const contract = useUbestarterLaunchpadV1(launchpadAddress)
  const call1 = useSingleCallResult(contract, 'getParticipantTotalTokenAmount', [account])
  const userTotalTokenAmount = call1.result?.[0] as BigNumber | undefined
  const call2 = useSingleCallResult(contract, 'getParticipantUnclaimedAmount', [account])
  const userUnclaimedTokenAmount = call2.result?.[0] as BigNumber | undefined

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const onBuyAction = () => {
    setIsBuyModalOpen(true)
    onBuy()
  }

  const [createLiquidityCallback, createLiqTx, isCreatingLiq] = useCreateLiquidity(launchpadAddress)
  const onCreateLiquidity = () => {
    if (isCreatingLiq == false) {
      createLiquidityCallback()
    }
  }

  const [userClaimCallback, userClaimTx, isUserClaimPending] = useUserClaim(launchpadAddress)
  const onUserClaim = () => {
    if (isUserClaimPending == false) {
      userClaimCallback()
    }
  }

  const [userRefundCallback, userRefundTx, isUserRefundPending] = useUserRefund(launchpadAddress)
  const onUserRefund = () => {
    if (isUserRefundPending == false) {
      userRefundCallback()
    }
  }

  const [ownerClaimCallback, ownerClaimTx, isOwnerClaimPending] = useOwnerClaim(launchpadAddress)
  const onOwnerClaim = () => {
    if (isOwnerClaimPending == false) {
      ownerClaimCallback()
    }
  }

  const [ownerRefundCallback, ownerRefundTx, isOwnerRefundPending] = useOwnerRefund(launchpadAddress)
  const onOwnerRefund = () => {
    if (isOwnerRefundPending == false) {
      ownerRefundCallback()
    }
  }

  const onDissmissConfirmationModal = useCallback(() => {}, [])

  //
  // launchpadTokenBalance = token.balanceOf(launchpadAddress)
  // launchpadQuoteBalance = qouteToken.balanceOf(launchpadAddress)
  // userTotalTokenAmount = launchpad.getParticipantTotalTokenAmount(account)
  //
  // if status == active
  //   [Buy]
  // else if status == succeded
  //   if isOwner == true
  //     [Create Liquidity]
  //   else
  //     [Waiting Liquidity...]-
  // else if status == done
  //   if isOwner == true
  //     if launchpadQuoteBalance > 0
  //       [Claim Raised Tokens]
  //     else
  //       [Launchpad Completed] -
  //   else
  //     if userTotalTokenAmount > 0
  //       [Claim]  disabled=(claimable == 0)
  //     else
  //       -----
  // else if status == failed || status == canceled
  //   if isOwner == true
  //     if launchpadTokenBalance > 0
  //       [Get Refund Tokens ]
  //     else
  //       [Already Refunded] -
  //   else
  //     if userTotalTokenAmount > 0
  //       [Get Refund Tokens]
  //     else
  //       -----
  //
  return (
    <Trace page={InterfacePageName.FARM_V3} shouldLogImpression>
      {launchpad.stats.status == 'Active' ? (
        account ? (
          <ButtonPrimary onClick={onBuyAction}>Buy</ButtonPrimary>
        ) : (
          <ConnectWalletButton onClick={toggleWalletDrawer}>
            <ThemedText.SubHeader color="white" lineHeight="20px">
              <Trans>Connect wallet</Trans>
            </ThemedText.SubHeader>
          </ConnectWalletButton>
        )
      ) : launchpad.stats.status == 'Succeeded' ? (
        isOwner ? (
          <ButtonPrimary onClick={onCreateLiquidity}>Create Liquidity</ButtonPrimary>
        ) : (
          <ButtonPrimary disabled>Waiting Liquidity...</ButtonPrimary>
        )
      ) : launchpad.stats.status == 'Done' ? (
        isOwner ? (
          launchpadQuoteBalance?.greaterThan(0) ? (
            <ButtonPrimary onClick={onOwnerClaim}>Claim Rised Tokens</ButtonPrimary>
          ) : (
            <ButtonPrimary disabled>Launchpad Completed</ButtonPrimary>
          )
        ) : userTotalTokenAmount?.gt(0) ? (
          <ButtonPrimary onClick={onUserClaim} disabled={!userUnclaimedTokenAmount?.gt(0)}>
            Claim
          </ButtonPrimary>
        ) : (
          <div></div>
        )
      ) : launchpad.stats.status == 'Failed' || launchpad.stats.status == 'Canceled' ? (
        isOwner ? (
          launchpadTokenBalance?.greaterThan(0) ? (
            <ButtonPrimary onClick={onOwnerRefund}>Get Refund Tokens</ButtonPrimary>
          ) : (
            <ButtonPrimary disabled>Already Refunded</ButtonPrimary>
          )
        ) : userTotalTokenAmount?.gt(0) ? (
          <ButtonPrimary onClick={onUserRefund}>Get Refund Tokens</ButtonPrimary>
        ) : (
          <div></div>
        )
      ) : (
        <div></div>
      )}
      <LaunchpadBuyModal
        launchpadAddress={launchpadAddress}
        launchpad={launchpad}
        isOpen={isBuyModalOpen && isSignatureValid}
        onDismiss={() => setIsBuyModalOpen(false)}
      />

      <TransactionConfirmationModal
        isOpen={isCreatingLiq}
        attemptingTxn={isCreatingLiq}
        hash={createLiqTx}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Creating Liquidity"
      />
      <TransactionConfirmationModal
        isOpen={isUserClaimPending}
        attemptingTxn={isUserClaimPending}
        hash={userClaimTx}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Claiming Tokens"
      />
      <TransactionConfirmationModal
        isOpen={isUserRefundPending}
        attemptingTxn={isUserRefundPending}
        hash={userRefundTx}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Getting refund tokens"
      />
      <TransactionConfirmationModal
        isOpen={isOwnerClaimPending}
        attemptingTxn={isOwnerClaimPending}
        hash={ownerClaimTx}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Claiming raised tokens"
      />
      <TransactionConfirmationModal
        isOpen={isOwnerRefundPending}
        attemptingTxn={isOwnerRefundPending}
        hash={ownerRefundTx}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Getting refund tokens"
      />
    </Trace>
  )
}
