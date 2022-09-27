import { BigNumber } from '@ethersproject/bignumber'
import Loader from 'components/Loader'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { bodySmall, headlineSmall } from 'nft/css/common.css'
import { BagStatus } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal } from 'nft/utils'
import { useModalIsOpen, useToggleWalletModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

import * as styles from './BagFooter.css'

interface BagFooterProps {
  balance: BigNumber
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
  balance,
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
      {showWarning && (
        <Row className={styles.warningContainer}>
          {!sufficientBalance
            ? `Insufficient funds (${formatWeiToDecimal(balance.toString())} ETH)`
            : `Something went wrong. Please try again.`}
        </Row>
      )}
      <Column
        borderTopLeftRadius={showWarning ? '0' : '12'}
        borderTopRightRadius={showWarning ? '0' : '12'}
        className={styles.footer}
      >
        <Column gap="4" paddingTop="8" paddingBottom="20">
          <Row justifyContent="space-between">
            <Box fontWeight="semibold" className={headlineSmall}>
              Total
            </Box>
            <Box fontWeight="semibold" className={headlineSmall}>
              {`${formatWeiToDecimal(totalEthPrice.toString())} ETH`}
            </Box>
          </Row>
          <Row justifyContent="flex-end" color="textSecondary" className={bodySmall}>
            {`${ethNumberStandardFormatter(totalUsdPrice, true)}`}
          </Row>
        </Column>
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
      </Column>
    </Column>
  )
}
