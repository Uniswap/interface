import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import Loader from 'components/Loader'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { bodySmall } from 'nft/css/common.css'
import { BagStatus } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal } from 'nft/utils'
import { AlertTriangle } from 'react-feather'
import { useModalIsOpen, useToggleWalletModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import * as styles from './BagFooter.css'

const Footer = styled.div<{ $showWarning: boolean }>`
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  border-top-left-radius: ${({ $showWarning }) => ($showWarning ? '0' : '12')}px;
  border-top-right-radius: ${({ $showWarning }) => ($showWarning ? '0' : '12')}px;
`

const WarningIcon = styled(AlertTriangle)`
  width: 14px;
  margin-right: 4px;
  color: ${({ theme }) => theme.accentWarning};
`
const WarningText = styled(ThemedText.BodyPrimary)`
  align-items: center;
  color: ${({ theme }) => theme.accentWarning};
  display: flex;
  justify-content: center;
  margin: 12px 0 !important;
  text-align: center;
`

interface BagFooterProps {
  isConnected: boolean
  sufficientBalance: boolean
  totalEthPrice: BigNumber
  totalUsdPrice: number | undefined
  bagStatus: BagStatus
  fetchAssets: () => void
  assetsAreInReview: boolean
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
]

export const BagFooter = ({
  isConnected,
  sufficientBalance,
  totalEthPrice,
  totalUsdPrice,
  bagStatus,
  fetchAssets,
  assetsAreInReview,
}: BagFooterProps) => {
  const toggleWalletModal = useToggleWalletModal()
  const walletModalIsOpen = useModalIsOpen(ApplicationModal.WALLET)

  const isPending = PENDING_BAG_STATUSES.includes(bagStatus) || walletModalIsOpen
  const isDisabled = isConnected && (isPending || !sufficientBalance || assetsAreInReview)

  const showWarning = isConnected && (!sufficientBalance || bagStatus === BagStatus.WARNING)

  return (
    <Column className={styles.footerContainer}>
      <Footer $showWarning={showWarning}>
        <Column gap="4" paddingTop="8" paddingBottom="20">
          <Row justifyContent="space-between">
            <Box>
              <ThemedText.HeadlineSmall>Total</ThemedText.HeadlineSmall>
            </Box>
            <Box>
              <ThemedText.HeadlineSmall>
                {formatWeiToDecimal(totalEthPrice.toString())}&nbsp;ETH
              </ThemedText.HeadlineSmall>
            </Box>
          </Row>
          <Row justifyContent="flex-end" color="textSecondary" className={bodySmall}>
            {`${ethNumberStandardFormatter(totalUsdPrice, true)}`}
          </Row>
        </Column>
        {showWarning && (
          <WarningText fontSize="14px" lineHeight="20px">
            <WarningIcon />
            {!sufficientBalance ? (
              <Trans>Insufficient funds</Trans>
            ) : (
              <Trans>Something went wrong. Please try again.</Trans>
            )}
          </WarningText>
        )}
        <Row
          as="button"
          color="explicitWhite"
          className={styles.payButton}
          disabled={isDisabled}
          onClick={() => {
            if (!isConnected) {
              toggleWalletModal()
            } else {
              fetchAssets()
            }
          }}
        >
          {isPending && <Loader size="20px" stroke="white" />}
          {!isConnected || walletModalIsOpen
            ? 'Connect wallet'
            : bagStatus === BagStatus.FETCHING_FINAL_ROUTE || bagStatus === BagStatus.CONFIRMING_IN_WALLET
            ? 'Proceed in wallet'
            : bagStatus === BagStatus.PROCESSING_TRANSACTION
            ? 'Transaction pending'
            : 'Pay'}
        </Row>
      </Footer>
    </Column>
  )
}
